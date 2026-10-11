<?php

namespace App\Services\Audit;

class AuditScoreCalculator
{
    private const PENALTY_HIGH = 10;
    private const PENALTY_MEDIUM = 5;
    private const PENALTY_LOW = 2;

    /**
     * Calculate deterministic SEO score, UX score, and overall weighted score.
     *
     * @param array<AuditIssueDto> $seoIssues
     * @param array<AuditIssueDto> $uxIssues
     * @return array{overall_score: int, seo_score: int, ux_score: int, seo_penalties: int, ux_penalties: int, evaluated_checks: int}
     */
    public function calculate(array $seoIssues, array $uxIssues): array
    {
        // Calculate SEO score
        $seoPenalties = 0;
        $seenSeoRules = [];
        foreach ($seoIssues as $issue) {
            if (isset($seenSeoRules[$issue->ruleCode])) {
                continue; // Prevent duplicate deductions
            }
            $seenSeoRules[$issue->ruleCode] = true;
            $seoPenalties += match ($issue->severity) {
                'high' => self::PENALTY_HIGH,
                'medium' => self::PENALTY_MEDIUM,
                'low' => self::PENALTY_LOW,
                default => 2,
            };
        }
        $seoScore = max(0, min(100, 100 - $seoPenalties));

        // Calculate UX score
        $uxPenalties = 0;
        $seenUxRules = [];
        foreach ($uxIssues as $issue) {
            if (isset($seenUxRules[$issue->ruleCode])) {
                continue;
            }
            $seenUxRules[$issue->ruleCode] = true;
            $uxPenalties += match ($issue->severity) {
                'high' => self::PENALTY_HIGH,
                'medium' => self::PENALTY_MEDIUM,
                'low' => self::PENALTY_LOW,
                default => 2,
            };
        }
        $uxScore = max(0, min(100, 100 - $uxPenalties));

        // Weighted Overall Score (60% SEO, 40% UX)
        $overallScore = (int) round(($seoScore * 0.60) + ($uxScore * 0.40));

        $totalEvaluated = count($seoIssues) + count($uxIssues) + 12; // Base checks evaluated

        return [
            'overall_score' => $overallScore,
            'seo_score' => $seoScore,
            'ux_score' => $uxScore,
            'seo_penalties' => $seoPenalties,
            'ux_penalties' => $uxPenalties,
            'evaluated_checks' => $totalEvaluated,
        ];
    }
}
