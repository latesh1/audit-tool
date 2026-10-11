<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    /**
     * Application Health check endpoint.
     */
    public function check(): JsonResponse
    {
        $dbConnected = false;
        try {
            DB::connection()->getPdo();
            $dbConnected = true;
        } catch (Throwable) {
            $dbConnected = false;
        }

        return response()->json([
            'status' => $dbConnected ? 'ok' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'database' => $dbConnected ? 'connected' : 'disconnected',
            'services' => [
                'ssrf_firewall' => 'active',
                'html_extractor' => 'ready',
                'deterministic_engine' => 'ready',
            ]
        ], $dbConnected ? 200 : 503);
    }
}
