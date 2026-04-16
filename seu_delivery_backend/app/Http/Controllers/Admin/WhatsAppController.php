<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Services\EvolutionApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WhatsAppController extends Controller
{
    private EvolutionApiService $evolutionApi;

    public function __construct(EvolutionApiService $evolutionApi)
    {
        $this->evolutionApi = $evolutionApi;
    }

    /**
     * Criar/conectar instância do WhatsApp (gera QR Code)
     * POST /api/admin/whatsapp/connect
     */
    public function connect(Request $request)
    {
        $admin = Auth::guard('sanctum')->user();

        $request->validate(['branch_id' => 'required|exists:branches,id']);
        $branchId = $request->branch_id;

        if ($admin->role !== 'master' && $admin->branch_id !== $branchId) {
            return response()->json(['message' => 'Sem permissão para esta filial'], 403);
        }

        $branch       = Branch::findOrFail($branchId);
        $instanceName = \Illuminate\Support\Str::slug($branch->name, '_');
        if (empty($instanceName)) {
            $instanceName = 'filial_' . $branch->id;
        }

        $webhookUrl = config('app.url') . '/api/webhooks/evolution/' . $branch->id;
        $result     = $this->evolutionApi->createInstance($instanceName, $webhookUrl);

        // Tratar "already in use" como sucesso
        if (!$result['success']) {
            $body = $result['body'] ?? null;
            if (is_string($body)) {
                $body = json_decode($body, true);
            }
            $alreadyExists = is_array($body)
                && isset($body['response']['message'][0])
                && str_contains($body['response']['message'][0], 'already in use');

            if (!$alreadyExists) {
                return response()->json([
                    'message' => 'Erro ao criar instância',
                    'error'   => $result['error'],
                ], 500);
            }
        }

        $branch->update([
            'whatsapp_instance_name' => $instanceName,
            'whatsapp_status'        => 'connecting',
        ]);

        // Tentar obter QR Code com retry
        $qrCode     = null;
        $maxRetries = 15;
        for ($i = 0; $i < $maxRetries; $i++) {
            if ($i > 0) {
                sleep(2);
            }
            $qrCode = $this->evolutionApi->fetchQrCode($instanceName);
            if ($qrCode['success'] && !empty($qrCode['qrcode'])) {
                break;
            }
        }

        if (!$qrCode || !$qrCode['success'] || empty($qrCode['qrcode'])) {
            return response()->json([
                'message'       => 'Instância criada. QR Code sendo gerado, aguarde e clique em "Atualizar Status"',
                'instance_name' => $instanceName,
                'status'        => 'connecting',
                'retry'         => true,
            ], 202);
        }

        return response()->json([
            'message'       => 'QR Code gerado com sucesso',
            'qrcode'        => $qrCode['qrcode'],
            'instance_name' => $instanceName,
            'status'        => 'connecting',
        ]);
    }

    /**
     * Buscar QR Code de instância existente
     * GET /api/admin/whatsapp/{branchId}/qrcode
     */
    public function getQrCode(Request $request, $branchId)
    {
        $admin = Auth::guard('sanctum')->user();
        if ($admin->role !== 'master' && $admin->branch_id != $branchId) {
            return response()->json(['message' => 'Sem permissão'], 403);
        }

        $branch = Branch::findOrFail($branchId);
        if (!$branch->whatsapp_instance_name) {
            return response()->json(['message' => 'Nenhuma instância configurada'], 404);
        }

        $qrCode = $this->evolutionApi->fetchQrCode($branch->whatsapp_instance_name);
        if (!$qrCode['success'] || empty($qrCode['qrcode'])) {
            return response()->json([
                'message' => 'QR Code ainda não disponível',
                'retry'   => true,
            ], 202);
        }

        return response()->json([
            'qrcode'        => $qrCode['qrcode'],
            'instance_name' => $branch->whatsapp_instance_name,
            'status'        => 'connecting',
        ]);
    }

    /**
     * Verificar status da conexão
     * GET /api/admin/whatsapp/{branchId}/status
     */
    public function status(Request $request, $branchId)
    {
        $admin = Auth::guard('sanctum')->user();
        if ($admin->role !== 'master' && $admin->branch_id != $branchId) {
            return response()->json(['message' => 'Sem permissão'], 403);
        }

        $branch = Branch::findOrFail($branchId);

        if (!$branch->whatsapp_instance_name) {
            return response()->json([
                'status'        => 'disconnected',
                'number'        => null,
                'connected_at'  => null,
                'instance_name' => null,
            ]);
        }

        $state = $this->evolutionApi->connectionState($branch->whatsapp_instance_name);

        if (!$state['success']) {
            return response()->json([
                'status'        => $branch->whatsapp_status ?? 'disconnected',
                'number'        => $branch->whatsapp_number,
                'connected_at'  => $branch->whatsapp_connected_at,
                'instance_name' => $branch->whatsapp_instance_name,
                'warning'       => 'Evolution API indisponível',
            ]);
        }

        $status = match($state['state']) {
            'open'       => 'connected',
            'connecting' => 'connecting',
            default      => 'disconnected',
        };

        if ($status === 'connected') {
            $updateData   = ['whatsapp_status' => $status];
            $phoneNumber  = $state['instance']['owner'] ?? null;
            if ($phoneNumber && str_contains($phoneNumber, '@')) {
                $phoneNumber = explode('@', $phoneNumber)[0];
            }
            if (!$branch->whatsapp_connected_at) {
                $updateData['whatsapp_connected_at'] = now();
            }
            if ($phoneNumber && $phoneNumber !== $branch->whatsapp_number) {
                $updateData['whatsapp_number'] = $phoneNumber;
            }
            $branch->update($updateData);
        } elseif ($status !== $branch->whatsapp_status) {
            $updateData = ['whatsapp_status' => $status];
            if ($status === 'disconnected') {
                $updateData['whatsapp_connected_at'] = null;
            }
            $branch->update($updateData);
        }

        return response()->json([
            'status'        => $status,
            'number'        => $branch->whatsapp_number,
            'connected_at'  => $branch->whatsapp_connected_at,
            'instance_name' => $branch->whatsapp_instance_name,
        ]);
    }

    /**
     * Desconectar WhatsApp
     * POST /api/admin/whatsapp/{branchId}/disconnect
     */
    public function disconnect(Request $request, $branchId)
    {
        $admin = Auth::guard('sanctum')->user();
        if ($admin->role !== 'master' && $admin->branch_id != $branchId) {
            return response()->json(['message' => 'Sem permissão'], 403);
        }

        $branch = Branch::findOrFail($branchId);
        if (!$branch->whatsapp_instance_name) {
            return response()->json(['message' => 'Nenhuma instância configurada'], 400);
        }

        $result = $this->evolutionApi->logout($branch->whatsapp_instance_name);
        if (!$result['success']) {
            return response()->json(['message' => 'Erro ao desconectar', 'error' => $result['error']], 500);
        }

        $branch->update([
            'whatsapp_status'       => 'disconnected',
            'whatsapp_number'       => null,
            'whatsapp_connected_at' => null,
        ]);

        return response()->json(['message' => 'WhatsApp desconectado', 'status' => 'disconnected']);
    }

    /**
     * Atualizar QR Code
     * POST /api/admin/whatsapp/{branchId}/refresh-qrcode
     */
    public function refreshQrCode(Request $request, $branchId)
    {
        $admin = Auth::guard('sanctum')->user();
        if ($admin->role !== 'master' && $admin->branch_id != $branchId) {
            return response()->json(['message' => 'Sem permissão'], 403);
        }

        $branch = Branch::findOrFail($branchId);

        if (!$branch->whatsapp_instance_name) {
            $instanceName = 'filial_' . $branch->id;
            $webhookUrl   = config('app.url') . '/api/webhooks/evolution/' . $branch->id;
            $result       = $this->evolutionApi->createInstance($instanceName, $webhookUrl);
            if (!$result['success']) {
                return response()->json(['message' => 'Erro ao criar instância', 'error' => $result['error']], 500);
            }
            $branch->update(['whatsapp_instance_name' => $instanceName, 'whatsapp_status' => 'connecting']);
        }

        $qrCode = $this->evolutionApi->fetchQrCode($branch->whatsapp_instance_name);

        if (!$qrCode['success']) {
            $state       = $this->evolutionApi->connectionState($branch->whatsapp_instance_name);
            $isConnected = $state['success'] && in_array($state['state'], ['open', 'connected']);
            if ($isConnected) {
                return response()->json(['message' => 'WhatsApp já está conectado.', 'status' => 'connected']);
            }
            return response()->json(['message' => 'Erro ao gerar QR Code', 'error' => $qrCode['error']], 500);
        }

        return response()->json(['message' => 'QR Code atualizado', 'qrcode' => $qrCode['qrcode']]);
    }
}
