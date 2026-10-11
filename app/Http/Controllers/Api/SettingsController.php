<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Ai\AiReportService;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    public function __construct(
        private readonly AiReportService $aiReportService
    ) {}

    /**
     * Get AI provider status safely without leaking secrets.
     */
    public function aiStatus(): JsonResponse
    {
        $status = $this->aiReportService->getProviderStatus();

        return response()->json([
            'data' => $status
        ]);
    }

    /**
     * Get system environment info safely.
     */
    public function systemInfo(): JsonResponse
    {
        return response()->json([
            'data' => [
                'app_name' => config('app.name', 'SiteScope AI'),
                'app_version' => '1.0.0-PROD-READY',
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'environment' => app()->environment(),
                'database_driver' => config('database.default'),
                'ssrf_protection_active' => true,
                'supported_ai_providers' => ['none', 'gemini', 'groq', 'deterministic_fallback'],
            ]
        ]);
    }
}
