<?php

namespace App\Services\Audit;

class AuditIssueDto
{
    public function __construct(
        public readonly string $category, // seo, ux, accessibility, technical
        public readonly string $ruleCode,
        public readonly string $title,
        public readonly string $severity, // high, medium, low
        public readonly array $evidence,
        public readonly ?string $explanation = null,
        public readonly ?string $recommendation = null,
        public readonly string $source = 'deterministic'
    ) {}

    public function toArray(): array
    {
        return [
            'category' => $this->category,
            'rule_code' => $this->ruleCode,
            'title' => $this->title,
            'severity' => $this->severity,
            'evidence' => $this->evidence,
            'explanation' => $this->explanation,
            'recommendation' => $this->recommendation,
            'source' => $this->source,
        ];
    }
}
