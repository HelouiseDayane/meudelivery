<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Motorcyclist;
use App\Models\DeliveryRecord;
use Illuminate\Http\Request;

class MotorcyclistController extends Controller
{
    // ── Motociclistas ──────────────────────────────────────────────

    public function index()
    {
        $motorcyclists = Motorcyclist::withCount('deliveryRecords')
            ->with(['deliveryRecords' => function ($q) {
                $q->orderBy('delivery_date', 'desc');
            }])
            ->orderBy('name')
            ->get()
            ->map(function ($m) {
                $totalDue   = $m->deliveryRecords->sum(fn($r) => (float)$r->amount_due);
                $totalPaid  = $m->deliveryRecords->sum(fn($r) => (float)$r->amount_paid);
                $totalDeliveries = $m->deliveryRecords->sum('deliveries_count');
                return array_merge($m->toArray(), [
                    'total_deliveries' => $totalDeliveries,
                    'total_due'        => round($totalDue, 2),
                    'total_paid'       => round($totalPaid, 2),
                    'total_balance'    => round($totalDue - $totalPaid, 2),
                ]);
            });

        return response()->json($motorcyclists);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'               => 'required|string|max:100',
            'phone'              => 'nullable|string|max:20',
            'moto'               => 'nullable|string|max:100',
            'plate'              => 'nullable|string|max:15',
            'pix_key'            => 'nullable|string|max:150',
            'price_per_delivery' => 'nullable|numeric|min:0',
            'is_active'          => 'nullable|boolean',
        ]);

        $motorcyclist = Motorcyclist::create($data);

        return response()->json($motorcyclist, 201);
    }

    public function show($id)
    {
        $m = Motorcyclist::with(['deliveryRecords' => function ($q) {
            $q->orderBy('delivery_date', 'desc');
        }])->findOrFail($id);

        $totalDue        = $m->deliveryRecords->sum(fn($r) => (float)$r->amount_due);
        $totalPaid       = $m->deliveryRecords->sum(fn($r) => (float)$r->amount_paid);
        $totalDeliveries = $m->deliveryRecords->sum('deliveries_count');

        return response()->json(array_merge($m->toArray(), [
            'total_deliveries' => $totalDeliveries,
            'total_due'        => round($totalDue, 2),
            'total_paid'       => round($totalPaid, 2),
            'total_balance'    => round($totalDue - $totalPaid, 2),
        ]));
    }

    public function update(Request $request, $id)
    {
        $m = Motorcyclist::findOrFail($id);

        $data = $request->validate([
            'name'               => 'sometimes|required|string|max:100',
            'phone'              => 'nullable|string|max:20',
            'moto'               => 'nullable|string|max:100',
            'plate'              => 'nullable|string|max:15',
            'pix_key'            => 'nullable|string|max:150',
            'price_per_delivery' => 'nullable|numeric|min:0',
            'is_active'          => 'nullable|boolean',
        ]);

        $m->update($data);

        return response()->json($m);
    }

    public function destroy($id)
    {
        $m = Motorcyclist::findOrFail($id);
        $m->delete();

        return response()->json(['message' => 'Motociclista removido']);
    }

    public function toggleActive($id)
    {
        $m = Motorcyclist::findOrFail($id);
        $m->update(['is_active' => !$m->is_active]);

        return response()->json([
            'id'        => $m->id,
            'is_active' => $m->is_active,
        ]);
    }

    // ── Registros de entrega ───────────────────────────────────────

    public function records($motorcyclistId)
    {
        $m = Motorcyclist::findOrFail($motorcyclistId);

        $records = $m->deliveryRecords()
            ->orderBy('delivery_date', 'desc')
            ->get()
            ->map(fn($r) => array_merge($r->toArray(), [
                'balance' => round((float)$r->amount_due - (float)$r->amount_paid, 2),
            ]));

        return response()->json($records);
    }

    public function storeRecord(Request $request, $motorcyclistId)
    {
        $m = Motorcyclist::findOrFail($motorcyclistId);

        $data = $request->validate([
            'delivery_date'    => 'required|date',
            'deliveries_count' => 'required|integer|min:0',
            'amount_paid'      => 'nullable|numeric|min:0',
            'is_paid'          => 'nullable|boolean',
            'paid_at'          => 'nullable|date',
            'notes'            => 'nullable|string|max:500',
        ]);

        // Calcula automaticamente o valor a receber
        $data['motorcyclist_id'] = $m->id;
        $data['amount_due'] = round($data['deliveries_count'] * (float)$m->price_per_delivery, 2);
        $data['amount_paid'] = $data['amount_paid'] ?? 0;

        // Marca pago se amount_paid >= amount_due
        if (!isset($data['is_paid'])) {
            $data['is_paid'] = $data['amount_paid'] >= $data['amount_due'] && $data['amount_due'] > 0;
        }
        if ($data['is_paid'] && empty($data['paid_at'])) {
            $data['paid_at'] = now()->toDateString();
        }

        $record = DeliveryRecord::create($data);

        return response()->json(array_merge($record->toArray(), [
            'balance' => round((float)$record->amount_due - (float)$record->amount_paid, 2),
        ]), 201);
    }

    public function updateRecord(Request $request, $motorcyclistId, $recordId)
    {
        $m      = Motorcyclist::findOrFail($motorcyclistId);
        $record = DeliveryRecord::where('motorcyclist_id', $m->id)->findOrFail($recordId);

        $data = $request->validate([
            'delivery_date'    => 'sometimes|date',
            'deliveries_count' => 'sometimes|integer|min:0',
            'amount_paid'      => 'nullable|numeric|min:0',
            'is_paid'          => 'nullable|boolean',
            'paid_at'          => 'nullable|date',
            'notes'            => 'nullable|string|max:500',
        ]);

        // Recalcula amount_due se mudou deliveries_count
        if (isset($data['deliveries_count'])) {
            $data['amount_due'] = round($data['deliveries_count'] * (float)$m->price_per_delivery, 2);
        }

        // Auto-marcar pago
        $newDue  = $data['amount_due']  ?? (float)$record->amount_due;
        $newPaid = $data['amount_paid'] ?? (float)$record->amount_paid;
        if (!isset($data['is_paid'])) {
            $data['is_paid'] = $newPaid >= $newDue && $newDue > 0;
        }
        if (($data['is_paid'] ?? $record->is_paid) && empty($data['paid_at']) && !$record->paid_at) {
            $data['paid_at'] = now()->toDateString();
        }

        $record->update($data);

        return response()->json(array_merge($record->fresh()->toArray(), [
            'balance' => round((float)$record->fresh()->amount_due - (float)$record->fresh()->amount_paid, 2),
        ]));
    }

    public function destroyRecord($motorcyclistId, $recordId)
    {
        $m      = Motorcyclist::findOrFail($motorcyclistId);
        $record = DeliveryRecord::where('motorcyclist_id', $m->id)->findOrFail($recordId);
        $record->delete();

        return response()->json(['message' => 'Registro removido']);
    }

    // Resumo financeiro de um motociclista (por período)
    public function summary(Request $request, $motorcyclistId)
    {
        $m = Motorcyclist::findOrFail($motorcyclistId);

        $query = $m->deliveryRecords();
        if ($request->has('from')) $query->where('delivery_date', '>=', $request->from);
        if ($request->has('to'))   $query->where('delivery_date', '<=', $request->to);

        $records = $query->orderBy('delivery_date')->get();

        $totalDeliveries = $records->sum('deliveries_count');
        $totalDue        = $records->sum(fn($r) => (float)$r->amount_due);
        $totalPaid       = $records->sum(fn($r) => (float)$r->amount_paid);

        return response()->json([
            'motorcyclist'    => $m->only(['id', 'name', 'pix_key', 'price_per_delivery']),
            'total_deliveries'=> $totalDeliveries,
            'total_due'       => round($totalDue, 2),
            'total_paid'      => round($totalPaid, 2),
            'total_balance'   => round($totalDue - $totalPaid, 2),
            'records'         => $records->map(fn($r) => array_merge($r->toArray(), [
                'balance' => round((float)$r->amount_due - (float)$r->amount_paid, 2),
            ])),
        ]);
    }
}
