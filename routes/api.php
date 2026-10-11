<?php

use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SiteScope AI API Routes
|--------------------------------------------------------------------------
*/

Route::get('/health', [HealthController::class, 'check']);
Route::get('/dashboard', [DashboardController::class, 'index']);

// Audit lifecycle routes
Route::post('/audits', [AuditController::class, 'store']);
Route::get('/audits', [AuditController::class, 'index']);
Route::get('/audits/{id}', [AuditController::class, 'show'])->whereNumber('id');
Route::get('/audits/{id}/status', [AuditController::class, 'status'])->whereNumber('id');
Route::delete('/audits/{id}', [AuditController::class, 'destroy'])->whereNumber('id');

// Diagnostics & Settings routes
Route::get('/settings/ai-status', [SettingsController::class, 'aiStatus']);
Route::get('/settings/system-info', [SettingsController::class, 'systemInfo']);
