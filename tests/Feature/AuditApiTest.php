<?php

namespace Tests\Feature;

use App\Models\Audit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AuditApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_submit_and_execute_audit_with_mocked_http(): void
    {
        $sampleHtml = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Savit Interactive - SEO Agency</title>
    <meta name="description" content="Savit Interactive provides high quality SEO and web development services.">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="canonical" href="https://savitinteractive.com/">
</head>
<body>
    <header><nav><a href="/">Home</a><a href="/contact">Contact Us</a></nav></header>
    <main>
        <h1>Custom SEO Solutions</h1>
        <p>Expert search marketing services for ambitious companies.</p>
        <a href="/contact">Get started</a>
    </main>
    <footer><p>&copy; 2026 Savit</p></footer>
</body>
</html>
HTML;

        // Mock external HTTP requests to ensure fast and deterministic test execution
        Http::fake([
            'https://savitinteractive.com*' => Http::response($sampleHtml, 200, ['Content-Type' => 'text/html']),
            'https://competitor.com*' => Http::response($sampleHtml, 200, ['Content-Type' => 'text/html']),
        ]);

        $payload = [
            'primary_url' => 'https://savitinteractive.com',
            'competitor_urls' => ['https://competitor.com'],
            'industry' => 'Digital Marketing',
            'target_audience' => 'Corporate Executives',
            'main_service' => 'Search Engine Optimization',
            'audit_objective' => 'Benchmark metadata and heading structure.',
        ];

        $response = $this->postJson('/api/audits', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.primary_url', 'https://savitinteractive.com')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'primary_url',
                    'status',
                    'overall_score',
                    'seo_score',
                    'ux_score',
                    'primary_website',
                    'competitor_websites',
                    'issues',
                    'ai_report',
                ]
            ]);

        $this->assertDatabaseHas('audits', [
            'primary_url' => 'https://savitinteractive.com',
            'status' => 'completed',
        ]);
    }

    public function test_validates_required_fields_and_prevents_duplicate_competitors(): void
    {
        // 1. Missing primary_url
        $resMissing = $this->postJson('/api/audits', []);
        $resMissing->assertStatus(422)
            ->assertJsonValidationErrors(['primary_url']);

        // 2. Competitor matches primary URL
        $resDuplicateDomain = $this->postJson('/api/audits', [
            'primary_url' => 'https://example.com',
            'competitor_urls' => ['https://example.com/other-page'],
        ]);
        $resDuplicateDomain->assertStatus(422)
            ->assertJsonValidationErrors(['competitor_urls.0']);
    }

    public function test_can_retrieve_paginated_audits_list(): void
    {
        Audit::create([
            'primary_url' => 'https://site1.com',
            'normalized_primary_url' => 'https://site1.com/',
            'status' => 'completed',
            'overall_score' => 85,
        ]);

        Audit::create([
            'primary_url' => 'https://site2.com',
            'normalized_primary_url' => 'https://site2.com/',
            'status' => 'failed',
        ]);

        $response = $this->getJson('/api/audits');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_retrieve_individual_audit_and_status(): void
    {
        $audit = Audit::create([
            'primary_url' => 'https://site1.com',
            'normalized_primary_url' => 'https://site1.com/',
            'status' => 'completed',
            'overall_score' => 90,
            'seo_score' => 95,
            'ux_score' => 82,
        ]);

        $resShow = $this->getJson("/api/audits/{$audit->id}");
        $resShow->assertStatus(200)
            ->assertJsonPath('data.id', $audit->id)
            ->assertJsonPath('data.overall_score', 90);

        $resStatus = $this->getJson("/api/audits/{$audit->id}/status");
        $resStatus->assertStatus(200)
            ->assertJsonPath('data.progress', 100);
    }

    public function test_can_delete_audit(): void
    {
        $audit = Audit::create([
            'primary_url' => 'https://to-delete.com',
            'normalized_primary_url' => 'https://to-delete.com/',
            'status' => 'completed',
        ]);

        $resDelete = $this->deleteJson("/api/audits/{$audit->id}");
        $resDelete->assertStatus(200);

        $this->assertDatabaseMissing('audits', ['id' => $audit->id]);
    }
}
