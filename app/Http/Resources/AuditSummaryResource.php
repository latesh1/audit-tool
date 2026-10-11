<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditSummaryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $primaryWebsite = $this->websites->firstWhere('role', 'primary');
        $competitors = $this->websites->where('role', 'competitor');

        return [
            'id' => $this->id,
            'primary_url' => $this->primary_url,
            'normalized_domain' => $primaryWebsite?->normalized_domain ?? parse_url($this->primary_url, PHP_URL_HOST),
            'industry' => $this->industry,
            'status' => $this->status,
            'overall_score' => $this->overall_score,
            'seo_score' => $this->seo_score,
            'ux_score' => $this->ux_score,
            'competitor_count' => $competitors->count(),
            'competitor_domains' => $competitors->pluck('normalized_domain')->all(),
            'issues_count' => $this->issues->count(),
            'high_issues_count' => $this->issues->where('severity', 'high')->count(),
            'created_at' => $this->created_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
        ];
    }
}
