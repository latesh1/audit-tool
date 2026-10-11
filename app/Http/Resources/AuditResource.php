<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $primaryWebsite = $this->websites->firstWhere('role', 'primary');
        $competitorWebsites = $this->websites->where('role', 'competitor')->values();

        return [
            'id' => $this->id,
            'primary_url' => $this->primary_url,
            'normalized_primary_url' => $this->normalized_primary_url,
            'industry' => $this->industry,
            'target_audience' => $this->target_audience,
            'main_service' => $this->main_service,
            'audit_objective' => $this->audit_objective,
            'status' => $this->status,
            'overall_score' => $this->overall_score,
            'seo_score' => $this->seo_score,
            'ux_score' => $this->ux_score,
            'error_code' => $this->error_code,
            'safe_error_message' => $this->safe_error_message,
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'primary_website' => $primaryWebsite ? [
                'id' => $primaryWebsite->id,
                'role' => $primaryWebsite->role,
                'original_url' => $primaryWebsite->original_url,
                'final_url' => $primaryWebsite->final_url,
                'normalized_domain' => $primaryWebsite->normalized_domain,
                'fetch_status' => $primaryWebsite->fetch_status,
                'http_status' => $primaryWebsite->http_status,
                'response_time_ms' => $primaryWebsite->response_time_ms,
                'extracted_data' => $primaryWebsite->extracted_data,
                'extraction_warnings' => $primaryWebsite->extraction_warnings ?? [],
            ] : null,
            'competitor_websites' => $competitorWebsites->map(function ($site) {
                return [
                    'id' => $site->id,
                    'role' => $site->role,
                    'original_url' => $site->original_url,
                    'final_url' => $site->final_url,
                    'normalized_domain' => $site->normalized_domain,
                    'fetch_status' => $site->fetch_status,
                    'http_status' => $site->http_status,
                    'response_time_ms' => $site->response_time_ms,
                    'extracted_data' => $site->extracted_data,
                    'extraction_warnings' => $site->extraction_warnings ?? [],
                ];
            }),
            'issues' => $this->issues->map(function ($issue) {
                return [
                    'id' => $issue->id,
                    'category' => $issue->category,
                    'rule_code' => $issue->rule_code,
                    'title' => $issue->title,
                    'severity' => $issue->severity,
                    'evidence' => $issue->evidence,
                    'explanation' => $issue->explanation,
                    'recommendation' => $issue->recommendation,
                    'source' => $issue->source,
                ];
            }),
            'ai_report' => $this->aiReport ? [
                'id' => $this->aiReport->id,
                'provider' => $this->aiReport->provider,
                'model' => $this->aiReport->model,
                'status' => $this->aiReport->status,
                'report' => $this->aiReport->report_json,
                'client_summary' => $this->aiReport->client_summary,
                'error_code' => $this->aiReport->error_code,
            ] : null,
        ];
    }
}
