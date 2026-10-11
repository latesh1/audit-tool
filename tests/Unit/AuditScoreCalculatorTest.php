<?php

namespace Tests\Unit;

use App\Services\Audit\AuditIssueDto;
use App\Services\Audit\AuditScoreCalculator;
use PHPUnit\Framework\TestCase;

class AuditScoreCalculatorTest extends TestCase
{
    private AuditScoreCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->calculator = new AuditScoreCalculator();
    }

    public function test_calculates_perfect_score_when_no_issues(): void
    {
        $result = $this->calculator->calculate([], []);

        $this->assertEquals(100, $result['overall_score']);
        $this->assertEquals(100, $result['seo_score']);
        $this->assertEquals(100, $result['ux_score']);
    }

    public function test_applies_weighted_penalties_correctly(): void
    {
        $seoIssues = [
            new AuditIssueDto('seo', 'SEO-TITLE-MISSING', 'Missing Title', 'high', []), // -10
            new AuditIssueDto('seo', 'SEO-CANONICAL-MISSING', 'Missing Canonical', 'medium', []), // -5
            new AuditIssueDto('seo', 'SEO-SCHEMA-MISSING', 'No Schema', 'low', []), // -2
        ]; // Total SEO Penalty = 17 -> SEO Score = 83

        $uxIssues = [
            new AuditIssueDto('ux', 'UX-CTA-MISSING', 'Missing CTA', 'high', []), // -10
        ]; // Total UX Penalty = 10 -> UX Score = 90

        $result = $this->calculator->calculate($seoIssues, $uxIssues);

        $this->assertEquals(83, $result['seo_score']);
        $this->assertEquals(90, $result['ux_score']);
        
        // Overall: (83 * 0.60) + (90 * 0.40) = 49.8 + 36.0 = 85.8 -> round to 86
        $this->assertEquals(86, $result['overall_score']);
    }

    public function test_clamps_score_to_zero_minimum(): void
    {
        $manyHighIssues = [];
        for ($i = 0; $i < 15; $i++) {
            $manyHighIssues[] = new AuditIssueDto('seo', "RULE-HIGH-{$i}", "High Issue {$i}", 'high', []);
        } // 15 * 10 = 150 points deducted

        $result = $this->calculator->calculate($manyHighIssues, []);
        $this->assertEquals(0, $result['seo_score']);
        $this->assertGreaterThanOrEqual(0, $result['overall_score']);
    }
}
