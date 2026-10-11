<?php

namespace App\Services\Audit;

use App\Models\AiReport;
use App\Models\Audit;
use App\Models\AuditIssue;
use App\Models\AuditWebsite;
use App\Services\Ai\AiReportService;
use App\Services\Comparison\CompetitorComparisonService;
use App\Services\Extraction\WebsiteExtractor;
use App\Services\Fetching\SafeWebsiteFetcher;
use App\Services\Security\WebsiteUrlValidator;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class AuditOrchestrator
{
    public function __construct(
        private readonly WebsiteUrlValidator $validator,
        private readonly SafeWebsiteFetcher $fetcher,
        private readonly WebsiteExtractor $extractor,
        private readonly SeoAuditService $seoAuditService,
        private readonly WebsiteUxAuditService $uxAuditService,
        private readonly AuditScoreCalculator $scoreCalculator,
        private readonly CompetitorComparisonService $comparisonService,
        private readonly AiReportService $aiReportService
    ) {}

    /**
     * Run the full audit execution workflow.
     *
     * @param Audit $audit
     * @param array<string> $competitorUrls
     * @return Audit
     */
    public function execute(Audit $audit, array $competitorUrls = []): Audit
    {
        $audit->update([
            'status' => 'running',
            'started_at' => now(),
        ]);

        try {
            // 1. Fetch Primary Website
            $primaryFetch = $this->fetcher->fetch($audit->primary_url);

            if (!$primaryFetch->isSuccess) {
                // Record primary website failure
                AuditWebsite::create([
                    'audit_id' => $audit->id,
                    'role' => 'primary',
                    'original_url' => $audit->primary_url,
                    'final_url' => $primaryFetch->finalUrl,
                    'normalized_domain' => $this->validator->extractDomain($audit->primary_url),
                    'fetch_status' => 'failed',
                    'http_status' => $primaryFetch->httpStatus,
                    'response_time_ms' => $primaryFetch->responseTimeMs,
                    'extracted_data' => null,
                    'extraction_warnings' => $primaryFetch->warnings,
                ]);

                $audit->update([
                    'status' => 'failed',
                    'error_code' => $primaryFetch->errorCode ?? 'FETCH_FAILED',
                    'safe_error_message' => $primaryFetch->errorMessage ?? 'Could not safely connect to the primary website.',
                    'completed_at' => now(),
                ]);

                return $audit->fresh(['websites', 'issues', 'aiReport']);
            }

            // 2. Extract Primary Website Data
            $primaryData = $this->extractor->extract($primaryFetch);

            $primaryWebsiteModel = AuditWebsite::create([
                'audit_id' => $audit->id,
                'role' => 'primary',
                'original_url' => $audit->primary_url,
                'final_url' => $primaryData->finalUrl,
                'normalized_domain' => $this->validator->extractDomain($primaryData->finalUrl),
                'fetch_status' => 'success',
                'http_status' => $primaryData->httpStatus,
                'response_time_ms' => $primaryData->responseTimeMs,
                'extracted_data' => $primaryData->toArray(),
                'extraction_warnings' => $primaryData->warnings,
            ]);

            // 3. Process Competitors Independently
            $competitorDataList = [];
            $hasCompetitorFailure = false;

            foreach ($competitorUrls as $compUrl) {
                if (empty(trim($compUrl))) continue;

                $compFetch = $this->fetcher->fetch($compUrl);
                $compDomain = $this->validator->extractDomain($compUrl);

                if (!$compFetch->isSuccess) {
                    $hasCompetitorFailure = true;
                    AuditWebsite::create([
                        'audit_id' => $audit->id,
                        'role' => 'competitor',
                        'original_url' => $compUrl,
                        'final_url' => $compFetch->finalUrl,
                        'normalized_domain' => $compDomain,
                        'fetch_status' => 'failed',
                        'http_status' => $compFetch->httpStatus,
                        'response_time_ms' => $compFetch->responseTimeMs,
                        'extracted_data' => null,
                        'extraction_warnings' => array_merge($compFetch->warnings, [
                            "Fetch error: " . ($compFetch->errorMessage ?? 'Connection failed')
                        ]),
                    ]);
                    continue;
                }

                $compExtracted = $this->extractor->extract($compFetch);
                $competitorDataList[] = $compExtracted;

                AuditWebsite::create([
                    'audit_id' => $audit->id,
                    'role' => 'competitor',
                    'original_url' => $compUrl,
                    'final_url' => $compExtracted->finalUrl,
                    'normalized_domain' => $this->validator->extractDomain($compExtracted->finalUrl),
                    'fetch_status' => 'success',
                    'http_status' => $compExtracted->httpStatus,
                    'response_time_ms' => $compExtracted->responseTimeMs,
                    'extracted_data' => $compExtracted->toArray(),
                    'extraction_warnings' => $compExtracted->warnings,
                ]);
            }

            // 4. Run Deterministic SEO & UX Audits
            $seoIssues = $this->seoAuditService->audit($primaryData);
            $uxIssues = $this->uxAuditService->audit($primaryData);
            $allIssues = array_merge($seoIssues, $uxIssues);

            // 5. Calculate Deterministic Scores
            $scores = $this->scoreCalculator->calculate($seoIssues, $uxIssues);

            // 6. Persist Issues to Database
            foreach ($allIssues as $issueDto) {
                AuditIssue::create([
                    'audit_id' => $audit->id,
                    'audit_website_id' => $primaryWebsiteModel->id,
                    'category' => $issueDto->category,
                    'rule_code' => $issueDto->ruleCode,
                    'title' => $issueDto->title,
                    'severity' => $issueDto->severity,
                    'evidence' => $issueDto->evidence,
                    'explanation' => $issueDto->explanation,
                    'recommendation' => $issueDto->recommendation,
                    'source' => $issueDto->source,
                ]);
            }

            // 7. Run Evidence-Based Competitor Comparison Matrix
            $comparisonData = [];
            if (!empty($competitorDataList)) {
                $comparisonData = $this->comparisonService->compare($primaryData, $competitorDataList);
            }

            // 8. Generate AI / Fallback Report
            $auditContext = [
                'industry' => $audit->industry,
                'target_audience' => $audit->target_audience,
                'main_service' => $audit->main_service,
                'audit_objective' => $audit->audit_objective,
            ];

            $aiResult = $this->aiReportService->generateReport(
                primaryData: $primaryData,
                competitorsData: $competitorDataList,
                deterministicIssues: $allIssues,
                auditContext: $auditContext
            );

            // Append comparison matrix to the report payload
            $finalReportPayload = array_merge($aiResult['report'], [
                'comparison_matrix' => $comparisonData['matrix'] ?? [],
                'identified_gaps' => $comparisonData['identified_gaps'] ?? [],
                'score_breakdown' => $scores,
            ]);

            AiReport::create([
                'audit_id' => $audit->id,
                'provider' => $aiResult['provider'],
                'model' => $aiResult['model'],
                'status' => $aiResult['status'],
                'report_json' => $finalReportPayload,
                'client_summary' => $aiResult['client_summary'],
                'error_code' => $aiResult['error'],
            ]);

            // 9. Determine Final Status
            $finalStatus = 'completed';
            if ($hasCompetitorFailure && count($competitorDataList) === 0 && !empty($competitorUrls)) {
                $finalStatus = 'partially_completed';
            } elseif ($hasCompetitorFailure) {
                $finalStatus = 'partially_completed';
            }

            $audit->update([
                'status' => $finalStatus,
                'overall_score' => $scores['overall_score'],
                'seo_score' => $scores['seo_score'],
                'ux_score' => $scores['ux_score'],
                'completed_at' => now(),
            ]);

            return $audit->fresh(['websites', 'issues', 'aiReport']);

        } catch (Throwable $e) {
            Log::error('Audit execution error', [
                'audit_id' => $audit->id,
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $audit->update([
                'status' => 'failed',
                'error_code' => 'EXECUTION_EXCEPTION',
                'safe_error_message' => 'An unexpected internal error occurred during audit analysis: ' . $e->getMessage(),
                'completed_at' => now(),
            ]);

            return $audit->fresh(['websites', 'issues', 'aiReport']);
        }
    }
}
