<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditSummaryResource;
use App\Models\Audit;
use App\Models\AuditIssue;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Get aggregate overview statistics from persisted database records.
     */
    public function index(): JsonResponse
    {
        $totalAudits = Audit::count();
        $successfulAudits = Audit::whereIn('status', ['completed', 'partially_completed'])->count();
        $failedAudits = Audit::where('status', 'failed')->count();

        $avgOverall = Audit::whereNotNull('overall_score')->avg('overall_score');
        $avgSeo = Audit::whereNotNull('seo_score')->avg('seo_score');
        $avgUx = Audit::whereNotNull('ux_score')->avg('ux_score');

        // Recent Audits
        $recentAudits = Audit::with(['websites', 'issues'])
            ->orderBy('id', 'desc')
            ->limit(6)
            ->get();

        // Issues Breakdown by Severity
        $issuesBySeverity = [
            'high' => AuditIssue::where('severity', 'high')->count(),
            'medium' => AuditIssue::where('severity', 'medium')->count(),
            'low' => AuditIssue::where('severity', 'low')->count(),
        ];

        // Issues Breakdown by Category
        $issuesByCategory = [
            'seo' => AuditIssue::where('category', 'seo')->count(),
            'ux' => AuditIssue::where('category', 'ux')->count(),
            'accessibility' => AuditIssue::where('category', 'accessibility')->count(),
        ];

        // Score Distribution
        $completedWithScores = Audit::whereNotNull('overall_score')->get();
        $scoreDistribution = [
            ['bracket' => '0-39 (Critical)', 'count' => $completedWithScores->whereBetween('overall_score', [0, 39])->count()],
            ['bracket' => '40-59 (Needs Work)', 'count' => $completedWithScores->whereBetween('overall_score', [40, 59])->count()],
            ['bracket' => '60-79 (Moderate)', 'count' => $completedWithScores->whereBetween('overall_score', [60, 79])->count()],
            ['bracket' => '80-100 (Strong)', 'count' => $completedWithScores->whereBetween('overall_score', [80, 100])->count()],
        ];

        // Recent Score Trends
        $recentTrends = Audit::whereNotNull('overall_score')
            ->orderBy('id', 'asc')
            ->limit(10)
            ->get(['id', 'overall_score', 'seo_score', 'ux_score', 'normalized_primary_url', 'created_at'])
            ->map(function ($a) {
                return [
                    'audit_id' => "#{$a->id}",
                    'domain' => parse_url($a->normalized_primary_url, PHP_URL_HOST) ?? $a->normalized_primary_url,
                    'overall' => $a->overall_score,
                    'seo' => $a->seo_score,
                    'ux' => $a->ux_score,
                    'date' => $a->created_at->format('M d'),
                ];
            });

        return response()->json([
            'data' => [
                'has_data' => $totalAudits > 0,
                'total_audits' => $totalAudits,
                'successful_audits' => $successfulAudits,
                'failed_audits' => $failedAudits,
                'average_scores' => [
                    'overall' => $avgOverall !== null ? (int) round($avgOverall) : null,
                    'seo' => $avgSeo !== null ? (int) round($avgSeo) : null,
                    'ux' => $avgUx !== null ? (int) round($avgUx) : null,
                ],
                'issues_by_severity' => $issuesBySeverity,
                'issues_by_category' => $issuesByCategory,
                'score_distribution' => $scoreDistribution,
                'recent_trends' => $recentTrends,
                'recent_audits' => AuditSummaryResource::collection($recentAudits),
            ]
        ]);
    }
}
