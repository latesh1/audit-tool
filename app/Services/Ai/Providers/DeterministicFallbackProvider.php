<?php

namespace App\Services\Ai\Providers;

use App\Services\Ai\AiProviderInterface;
use App\Services\Extraction\ExtractedWebsiteData;

class DeterministicFallbackProvider implements AiProviderInterface
{
    public function getProviderKey(): string
    {
        return 'deterministic_fallback';
    }

    public function isAvailable(): bool
    {
        return true;
    }

    public function generateReport(
        ExtractedWebsiteData $primaryData,
        array $competitorsData,
        array $deterministicIssues,
        array $auditContext = []
    ): array {
        $strengths = [];
        $weaknesses = [];
        $importantIssues = [];
        $recommendations = [];

        // Identify Strengths from facts
        if ($primaryData->isHttps) {
            $strengths[] = [
                'title' => 'Encrypted HTTPS Connection',
                'evidence' => ['Served securely over HTTPS protocol'],
                'explanation' => 'Protects user session security and fulfills a foundational search engine trust standard.'
            ];
        }

        if (!empty($primaryData->title) && $primaryData->titleLength >= 30 && $primaryData->titleLength <= 65) {
            $strengths[] = [
                'title' => 'Optimal Title Tag Length',
                'evidence' => ["Title: '{$primaryData->title}' ({$primaryData->titleLength} characters)"],
                'explanation' => 'Title tag fits standard search engine snippet display limits without truncation.'
            ];
        }

        if (count($primaryData->h1s) === 1) {
            $strengths[] = [
                'title' => 'Single Well-Defined H1 Heading',
                'evidence' => ["H1: '{$primaryData->h1s[0]}'"],
                'explanation' => 'Clear primary topical focus for assistive readers and search engine indexers.'
            ];
        }

        if ($primaryData->totalImages > 0 && $primaryData->imagesMissingAlt === 0) {
            $strengths[] = [
                'title' => 'Complete Image Accessibility Coverage',
                'evidence' => ["{$primaryData->totalImages} images analyzed with 100% alt text presence"],
                'explanation' => 'Enhances web accessibility compliance and image search ranking signals.'
            ];
        }

        if ($primaryData->hasStructuredData) {
            $strengths[] = [
                'title' => 'Structured Data (Schema.org) Implemented',
                'evidence' => ['Types detected: ' . implode(', ', $primaryData->schemaTypes)],
                'explanation' => 'Enables search engines to parse rich entity information and SERP rich snippets.'
            ];
        }

        if (!empty($primaryData->ctaCandidates)) {
            $strengths[] = [
                'title' => 'Identifiable Conversion Triggers (CTAs)',
                'evidence' => ["Matched phrases: " . implode(', ', array_column($primaryData->ctaCandidates, 'text'))],
                'explanation' => 'Provides direct visual action pathways for prospective visitors.'
            ];
        }

        // Identify Weaknesses & Important Issues from issues
        foreach ($deterministicIssues as $issue) {
            $issueArray = is_array($issue) ? $issue : $issue->toArray();
            $sev = ucfirst(strtolower($issueArray['severity']));
            
            $weaknesses[] = [
                'title' => $issueArray['title'],
                'evidence' => [json_encode($issueArray['evidence'])],
                'explanation' => $issueArray['explanation'] ?? 'Requires optimization for best practices.'
            ];

            if ($sev === 'High' || $sev === 'Medium') {
                $importantIssues[] = [
                    'title' => $issueArray['title'],
                    'severity' => $sev,
                    'evidence' => [json_encode($issueArray['evidence'])],
                    'recommendation' => $issueArray['recommendation'] ?? 'Implement recommended fix.',
                    'source_rule_codes' => [$issueArray['rule_code']]
                ];

                $recommendations[] = [
                    'priority' => $sev,
                    'title' => 'Resolve ' . $issueArray['title'],
                    'action' => $issueArray['recommendation'] ?? 'Review and update website markup.',
                    'rationale' => $issueArray['explanation'] ?? 'Improves overall website health.'
                ];
            }
        }

        // Competitor Summaries
        $competitorSummary = [];
        foreach ($competitorsData as $comp) {
            $compStrengths = [];
            $compGaps = [];
            $compLimitations = [];

            if ($comp->hasStructuredData) $compStrengths[] = 'Implements Schema structured markup';
            if ($comp->isHttps) $compStrengths[] = 'HTTPS enabled';
            if ($comp->wordCount > 300) $compStrengths[] = "Visible content depth ({$comp->wordCount} words)";

            if (empty($comp->metaDescription)) $compGaps[] = 'Missing meta description tag';
            if (empty($comp->title)) $compGaps[] = 'Missing title tag';
            if ($comp->imagesMissingAlt > 0) $compGaps[] = "{$comp->imagesMissingAlt} images missing alt text";

            if ($comp->wordCount < 100) $compLimitations[] = 'Low extractable visible HTML text';

            $competitorSummary[] = [
                'competitor_url' => $comp->finalUrl,
                'strengths' => $compStrengths,
                'gaps' => $compGaps,
                'limitations' => $compLimitations,
            ];
        }

        $clientSummary = "Audit completed using SiteScope deterministic rule engine for {$primaryData->finalUrl}. " .
            count($strengths) . " structural strengths and " . count($deterministicIssues) . " optimization points were detected.";

        if (!empty($auditContext['industry'])) {
            $clientSummary .= " Tailored context: Industry [{$auditContext['industry']}].";
        }

        $report = [
            'client_summary' => $clientSummary,
            'strengths' => array_slice($strengths, 0, 8),
            'weaknesses' => array_slice($weaknesses, 0, 8),
            'important_issues' => array_slice($importantIssues, 0, 10),
            'recommendations' => array_slice($recommendations, 0, 8),
            'competitor_summary' => $competitorSummary,
            'engine_note' => 'Generated via SiteScope Deterministic Knowledge Engine (No external LLM API key required).',
        ];

        return [
            'status' => 'fallback',
            'provider' => 'deterministic_fallback',
            'model' => 'rule_engine_v1',
            'report' => $report,
            'client_summary' => $clientSummary,
            'error' => null,
        ];
    }
}
