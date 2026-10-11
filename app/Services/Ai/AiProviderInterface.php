<?php

namespace App\Services\Ai;

use App\Services\Extraction\ExtractedWebsiteData;

interface AiProviderInterface
{
    /**
     * Get provider identifier key.
     */
    public function getProviderKey(): string;

    /**
     * Check if provider is configured and available.
     */
    public function isAvailable(): bool;

    /**
     * Generate an evidence-backed audit report JSON.
     *
     * @param ExtractedWebsiteData $primaryData
     * @param array<ExtractedWebsiteData> $competitorsData
     * @param array $deterministicIssues
     * @param array $auditContext (industry, target_audience, main_service, audit_objective)
     * @return array{status: string, provider: string, model: ?string, report: array, client_summary: ?string, error: ?string}
     */
    public function generateReport(
        ExtractedWebsiteData $primaryData,
        array $competitorsData,
        array $deterministicIssues,
        array $auditContext = []
    ): array;
}
