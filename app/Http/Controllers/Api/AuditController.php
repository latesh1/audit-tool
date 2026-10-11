<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAuditRequest;
use App\Http\Resources\AuditResource;
use App\Http\Resources\AuditSummaryResource;
use App\Models\Audit;
use App\Services\Audit\AuditOrchestrator;
use App\Services\Security\WebsiteUrlValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AuditController extends Controller
{
    public function __construct(
        private readonly AuditOrchestrator $orchestrator,
        private readonly WebsiteUrlValidator $validator
    ) {}

    /**
     * List all audits with pagination, status filter, and search.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Audit::with(['websites', 'issues'])
            ->orderBy('id', 'desc');

        if ($status = $request->input('status')) {
            if (in_array($status, ['completed', 'partially_completed', 'failed', 'running', 'queued'], true)) {
                $query->where('status', $status);
            }
        }

        if ($search = trim($request->input('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('primary_url', 'like', "%{$search}%")
                  ->orWhere('normalized_primary_url', 'like', "%{$search}%")
                  ->orWhere('industry', 'like', "%{$search}%");
            });
        }

        $perPage = min(50, max(1, (int) $request->input('per_page', 10)));
        $audits = $query->paginate($perPage);

        return AuditSummaryResource::collection($audits);
    }

    /**
     * Create and execute a new audit.
     */
    public function store(StoreAuditRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $normalizedPrimary = $this->validator->normalize($validated['primary_url']);

        $audit = Audit::create([
            'primary_url' => $validated['primary_url'],
            'normalized_primary_url' => $normalizedPrimary,
            'industry' => $validated['industry'] ?? null,
            'target_audience' => $validated['target_audience'] ?? null,
            'main_service' => $validated['main_service'] ?? null,
            'audit_objective' => $validated['audit_objective'] ?? null,
            'status' => 'queued',
        ]);

        $competitorUrls = array_filter((array) ($validated['competitor_urls'] ?? []));

        // Execute audit through orchestrator
        $completedAudit = $this->orchestrator->execute($audit, $competitorUrls);

        return (new AuditResource($completedAudit))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Retrieve a specific audit by ID.
     */
    public function show(int $id): JsonResponse
    {
        $audit = Audit::with(['websites', 'issues', 'aiReport'])->find($id);

        if (!$audit) {
            return response()->json([
                'message' => 'Audit record not found.',
                'error_code' => 'AUDIT_NOT_FOUND',
            ], 404);
        }

        return (new AuditResource($audit))->response();
    }

    /**
     * Get quick status for real-time polling.
     */
    public function status(int $id): JsonResponse
    {
        $audit = Audit::select(['id', 'status', 'overall_score', 'seo_score', 'ux_score', 'error_code', 'started_at', 'completed_at'])
            ->find($id);

        if (!$audit) {
            return response()->json([
                'message' => 'Audit record not found.',
            ], 404);
        }

        $progress = match ($audit->status) {
            'queued' => 10,
            'running' => 60,
            'completed', 'partially_completed' => 100,
            'failed' => 100,
            default => 0,
        };

        return response()->json([
            'data' => [
                'id' => $audit->id,
                'status' => $audit->status,
                'progress' => $progress,
                'overall_score' => $audit->overall_score,
                'seo_score' => $audit->seo_score,
                'ux_score' => $audit->ux_score,
                'error_code' => $audit->error_code,
                'started_at' => $audit->started_at?->toIso8601String(),
                'completed_at' => $audit->completed_at?->toIso8601String(),
            ]
        ]);
    }

    /**
     * Delete an audit record.
     */
    public function destroy(int $id): JsonResponse
    {
        $audit = Audit::find($id);

        if (!$audit) {
            return response()->json([
                'message' => 'Audit record not found.',
            ], 404);
        }

        $audit->delete();

        return response()->json([
            'message' => 'Audit deleted successfully.',
            'id' => $id,
        ]);
    }
}
