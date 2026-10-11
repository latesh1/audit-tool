<?php

namespace App\Services\Ai;

use App\Services\Ai\Providers\DeterministicFallbackProvider;
use App\Services\Ai\Providers\GeminiAiProvider;
use App\Services\Ai\Providers\GroqAiProvider;
use App\Services\Extraction\ExtractedWebsiteData;
use Illuminate\Support\Facades\Log;

class AiReportService
{
    private DeterministicFallbackProvider $fallbackProvider;

    public function __construct(
        private readonly ?AiProviderInterface $primaryProvider = null
    ) {
        $this->fallbackProvider = new DeterministicFallbackProvider();
    }

    /**
     * Resolve configured provider dynamically from environment/configuration.
     */
    public static function createFromConfig(): self
    {
        $providerKey = strtolower(env('AI_PROVIDER', 'none'));
        $apiKey = env('AI_API_KEY') ?: env('GEMINI_API_KEY') ?: env('GROQ_API_KEY');
        $model = env('AI_MODEL');
        $timeout = (int) env('AI_TIMEOUT', 30);
        $baseUrl = env('AI_BASE_URL');

        $provider = match ($providerKey) {
            'gemini' => new GeminiAiProvider(
                apiKey: $apiKey,
                model: $model ?: 'gemini-1.5-flash',
                timeout: $timeout
            ),
            'groq' => new GroqAiProvider(
                apiKey: $apiKey,
                model: $model ?: 'llama-3.3-70b-versatile',
                baseUrl: $baseUrl ?: 'https://api.groq.com/openai/v1',
                timeout: $timeout
            ),
            default => null,
        };

        return new self($provider);
    }

    /**
     * Get diagnostic status of configured AI provider (safe to expose, no secrets).
     */
    public function getProviderStatus(): array
    {
        $configuredProvider = strtolower(env('AI_PROVIDER', 'none'));
        $hasKey = !empty(env('AI_API_KEY') ?: env('GEMINI_API_KEY') ?: env('GROQ_API_KEY'));

        return [
            'configured_provider' => $configuredProvider,
            'is_configured' => $configuredProvider !== 'none' && $hasKey,
            'model' => env('AI_MODEL') ?: ($configuredProvider === 'gemini' ? 'gemini-1.5-flash' : ($configuredProvider === 'groq' ? 'llama-3.3-70b-versatile' : 'deterministic_rules_v1')),
            'fallback_active' => $configuredProvider === 'none' || !$hasKey,
            'supports_streaming' => false,
            'safe_notice' => $configuredProvider === 'none' || !$hasKey
                ? 'AI is running in deterministic knowledge engine mode. All checks, scores, and comparisons are evaluated accurately from direct HTML evidence.'
                : 'AI LLM provider is active for contextual synthesis.',
        ];
    }

    /**
     * Generate structured AI insights with automatic deterministic fallback.
     */
    public function generateReport(
        ExtractedWebsiteData $primaryData,
        array $competitorsData,
        array $deterministicIssues,
        array $auditContext = []
    ): array {
        // If primary provider is configured and available, try it
        if ($this->primaryProvider !== null && $this->primaryProvider->isAvailable()) {
            $result = $this->primaryProvider->generateReport($primaryData, $competitorsData, $deterministicIssues, $auditContext);
            if ($result['status'] === 'success') {
                return $result;
            }

            Log::info('Primary AI provider failed, switching to deterministic fallback', [
                'provider' => $result['provider'],
                'error' => $result['error']
            ]);
        }

        // Deterministic Fallback
        return $this->fallbackProvider->generateReport($primaryData, $competitorsData, $deterministicIssues, $auditContext);
    }
}
