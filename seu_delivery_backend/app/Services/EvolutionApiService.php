<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EvolutionApiService
{
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.evolution_api.url', 'http://localhost:8080'), '/');
        $this->apiKey  = config('services.evolution_api.api_key', '');
    }

    public function createInstance(string $instanceName, ?string $webhook = null): array
    {
        try {
            $payload = [
                'instanceName' => $instanceName,
                'qrcode'       => true,
                'integration'  => 'WHATSAPP-BAILEYS',
            ];

            if ($webhook) {
                $payload['webhook'] = [
                    'url'              => $webhook,
                    'enabled'          => true,
                    'webhookByEvents'  => true,
                    'webhookBase64'    => false,
                    'events'           => ['CONNECTION_UPDATE', 'QRCODE_UPDATED'],
                ];
            }

            $response = Http::withHeaders([
                'apikey'       => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/instance/create", $payload);

            if ($response->successful()) {
                return ['success' => true, 'data' => $response->json()];
            }

            return [
                'success' => false,
                'error'   => $response->json()['message'] ?? 'Erro ao criar instância',
                'body'    => $response->body(),
                'json'    => $response->json(),
            ];
        } catch (\Exception $e) {
            Log::error('EvolutionApiService::createInstance - ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage(), 'body' => null, 'json' => null];
        }
    }

    public function fetchQrCode(string $instanceName): array
    {
        try {
            $response = Http::withHeaders(['apikey' => $this->apiKey])
                ->get("{$this->baseUrl}/instance/connect/{$instanceName}");

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'qrcode'  => $data['qrcode']['base64'] ?? $data['base64'] ?? null,
                    'code'    => $data['qrcode']['code']   ?? $data['code']   ?? null,
                ];
            }

            return [
                'success' => false,
                'error'   => $response->json()['message'] ?? 'Erro ao buscar QR Code',
            ];
        } catch (\Exception $e) {
            Log::error('EvolutionApiService::fetchQrCode - ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function connectionState(string $instanceName): array
    {
        try {
            $response = Http::withHeaders(['apikey' => $this->apiKey])
                ->get("{$this->baseUrl}/instance/connectionState/{$instanceName}");

            if ($response->successful()) {
                $data  = $response->json();
                $state = $data['instance']['state'] ?? $data['state'] ?? 'close';
                return ['success' => true, 'state' => $state, 'instance' => $data['instance'] ?? []];
            }

            if ($response->status() === 404) {
                return ['success' => true, 'state' => 'close', 'instance' => []];
            }

            return ['success' => false, 'error' => 'Erro ao verificar conexão'];
        } catch (\Exception $e) {
            Log::error('EvolutionApiService::connectionState - ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function logout(string $instanceName): array
    {
        try {
            $response = Http::withHeaders(['apikey' => $this->apiKey])
                ->delete("{$this->baseUrl}/instance/logout/{$instanceName}");

            if ($response->successful()) {
                return ['success' => true];
            }

            return [
                'success' => false,
                'error'   => $response->json()['message'] ?? 'Erro ao desconectar',
            ];
        } catch (\Exception $e) {
            Log::error('EvolutionApiService::logout - ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function deleteInstance(string $instanceName): array
    {
        try {
            $response = Http::withHeaders(['apikey' => $this->apiKey])
                ->delete("{$this->baseUrl}/instance/delete/{$instanceName}");

            if ($response->successful() || $response->status() === 404) {
                return ['success' => true];
            }

            return [
                'success' => false,
                'error'   => $response->json()['message'] ?? 'Erro ao deletar instância',
            ];
        } catch (\Exception $e) {
            Log::error('EvolutionApiService::deleteInstance - ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function sendTextMessage(string $instanceName, string $number, string $text): array
    {
        try {
            $response = Http::withHeaders([
                'apikey'       => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/message/sendText/{$instanceName}", [
                'number' => $number,
                'text'   => $text,
            ]);

            if ($response->successful()) {
                return ['success' => true, 'data' => $response->json()];
            }

            return [
                'success' => false,
                'error'   => $response->json()['message'] ?? 'Erro ao enviar mensagem',
            ];
        } catch (\Exception $e) {
            Log::error('EvolutionApiService::sendTextMessage - ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
