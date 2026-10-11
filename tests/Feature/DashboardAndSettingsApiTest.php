<?php

namespace Tests\Feature;

use App\Models\Audit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardAndSettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_real_aggregated_metrics(): void
    {
        // 1. Empty state
        $resEmpty = $this->getJson('/api/dashboard');
        $resEmpty->assertStatus(200)
            ->assertJsonPath('data.has_data', false)
            ->assertJsonPath('data.total_audits', 0);

        // 2. Populated state
        Audit::create([
            'primary_url' => 'https://site1.com',
            'normalized_primary_url' => 'https://site1.com/',
            'status' => 'completed',
            'overall_score' => 80,
            'seo_score' => 85,
            'ux_score' => 75,
        ]);

        Audit::create([
            'primary_url' => 'https://site2.com',
            'normalized_primary_url' => 'https://site2.com/',
            'status' => 'completed',
            'overall_score' => 90,
            'seo_score' => 95,
            'ux_score' => 85,
        ]);

        $resPopulated = $this->getJson('/api/dashboard');
        $resPopulated->assertStatus(200)
            ->assertJsonPath('data.has_data', true)
            ->assertJsonPath('data.total_audits', 2)
            ->assertJsonPath('data.successful_audits', 2)
            ->assertJsonPath('data.average_scores.overall', 85);
    }

    public function test_health_check_endpoint(): void
    {
        $response = $this->getJson('/api/health');
        $response->assertStatus(200)
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('database', 'connected');
    }

    public function test_settings_ai_status_does_not_leak_secrets(): void
    {
        $response = $this->getJson('/api/settings/ai-status');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'configured_provider',
                    'is_configured',
                    'model',
                    'fallback_active',
                    'safe_notice',
                ]
            ]);

        $this->assertArrayNotHasKey('api_key', $response->json('data'));
    }

    public function test_system_info_endpoint(): void
    {
        $response = $this->getJson('/api/settings/system-info');
        $response->assertStatus(200)
            ->assertJsonPath('data.ssrf_protection_active', true);
    }
}
