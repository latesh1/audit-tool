<?php

namespace App\Services\Fetching;

use App\Services\Security\WebsiteUrlValidator;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SafeWebsiteFetcher
{
    private const MAX_REDIRECTS = 5;
    private const CONNECT_TIMEOUT_SECONDS = 5;
    private const TOTAL_TIMEOUT_SECONDS = 10;
    private const MAX_BODY_BYTES = 2097152; // 2 MB
    private const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SiteScopeAI-Audit/1.0';

    public function __construct(
        private readonly WebsiteUrlValidator $validator
    ) {}

    /**
     * Safely fetch a target website with strict SSRF defense, manual redirect hop validation, and payload limits.
     */
    public function fetch(string $targetUrl): FetchResult
    {
        $currentUrl = $this->validator->normalize($targetUrl);
        $redirectHistory = [];
        $warnings = [];
        $startTime = microtime(true);

        for ($hop = 0; $hop <= self::MAX_REDIRECTS; $hop++) {
            // Validate destination URL and IP safety BEFORE every hop
            $safetyCheck = $this->validator->validateUrlSafety($currentUrl);
            if (!$safetyCheck['is_safe']) {
                $elapsedMs = (int) round((microtime(true) - $startTime) * 1000);
                return FetchResult::failure(
                    requestedUrl: $targetUrl,
                    errorCode: $safetyCheck['error_code'] ?? 'SSRF_BLOCKED',
                    errorMessage: $safetyCheck['message'] ?? 'Destination URL failed SSRF security checks.',
                    responseTimeMs: $elapsedMs,
                    redirectHistory: $redirectHistory,
                    warnings: array_merge($warnings, ['Security policy blocked destination at hop ' . $hop])
                );
            }

            try {
                // Execute HTTP GET request without following automatic redirects
                $response = Http::withHeaders([
                    'User-Agent' => self::USER_AGENT,
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language' => 'en-US,en;q=0.9',
                    'Cache-Control' => 'no-cache',
                ])
                ->withoutRedirecting()
                ->connectTimeout(self::CONNECT_TIMEOUT_SECONDS)
                ->timeout(self::TOTAL_TIMEOUT_SECONDS)
                ->send('GET', $currentUrl);

                $statusCode = $response->status();

                // Handle Redirects manually (301, 302, 303, 307, 308)
                if (in_array($statusCode, [301, 302, 303, 307, 308], true)) {
                    $locationHeader = $response->header('Location');
                    if (empty($locationHeader)) {
                        $elapsedMs = (int) round((microtime(true) - $startTime) * 1000);
                        return FetchResult::failure(
                            requestedUrl: $targetUrl,
                            errorCode: 'EMPTY_REDIRECT_LOCATION',
                            errorMessage: 'Website returned a redirect status without a Location header.',
                            httpStatus: $statusCode,
                            responseTimeMs: $elapsedMs,
                            redirectHistory: $redirectHistory
                        );
                    }

                    // Resolve relative redirect location
                    $nextUrl = $this->resolveRedirectUrl($currentUrl, $locationHeader);
                    $redirectHistory[] = [
                        'from' => $currentUrl,
                        'to' => $nextUrl,
                        'status' => $statusCode,
                    ];

                    if ($hop === self::MAX_REDIRECTS) {
                        $elapsedMs = (int) round((microtime(true) - $startTime) * 1000);
                        return FetchResult::failure(
                            requestedUrl: $targetUrl,
                            errorCode: 'TOO_MANY_REDIRECTS',
                            errorMessage: 'Exceeded maximum allowable redirects (' . self::MAX_REDIRECTS . ').',
                            httpStatus: $statusCode,
                            responseTimeMs: $elapsedMs,
                            redirectHistory: $redirectHistory
                        );
                    }

                    $currentUrl = $nextUrl;
                    continue; // Proceed to next hop
                }

                $elapsedMs = (int) round((microtime(true) - $startTime) * 1000);
                $contentType = $response->header('Content-Type') ?? '';

                // Verify content type is HTML
                if (!empty($contentType) && !str_contains(strtolower($contentType), 'text/html') && !str_contains(strtolower($contentType), 'application/xhtml+xml')) {
                    $warnings[] = "Non-standard HTML content type: {$contentType}";
                }

                // Check HTTP error statuses
                if ($response->failed()) {
                    return FetchResult::failure(
                        requestedUrl: $targetUrl,
                        errorCode: 'HTTP_STATUS_' . $statusCode,
                        errorMessage: "Target website responded with HTTP {$statusCode}.",
                        httpStatus: $statusCode,
                        responseTimeMs: $elapsedMs,
                        redirectHistory: $redirectHistory,
                        warnings: $warnings
                    );
                }

                $body = $response->body();

                // Cap body size to 2MB
                if (strlen($body) > self::MAX_BODY_BYTES) {
                    $body = substr($body, 0, self::MAX_BODY_BYTES);
                    $warnings[] = 'Website HTML exceeded 2MB limit and was truncated for analysis.';
                }

                return new FetchResult(
                    isSuccess: true,
                    requestedUrl: $targetUrl,
                    finalUrl: $currentUrl,
                    httpStatus: $statusCode,
                    responseTimeMs: $elapsedMs,
                    htmlContent: $body,
                    contentType: $contentType,
                    errorCode: null,
                    errorMessage: null,
                    redirectHistory: $redirectHistory,
                    warnings: $warnings
                );

            } catch (Exception $e) {
                $elapsedMs = (int) round((microtime(true) - $startTime) * 1000);
                Log::warning('SafeWebsiteFetcher error', [
                    'url' => $currentUrl,
                    'error' => $e->getMessage(),
                ]);

                $safeMsg = 'Could not establish a connection to the target website.';
                $errCode = 'CONNECTION_FAILED';

                if (str_contains(strtolower($e->getMessage()), 'timed out') || str_contains(strtolower($e->getMessage()), 'timeout')) {
                    $safeMsg = 'The website request timed out before a response was received.';
                    $errCode = 'TIMEOUT';
                } elseif (str_contains(strtolower($e->getMessage()), 'ssl') || str_contains(strtolower($e->getMessage()), 'tls') || str_contains(strtolower($e->getMessage()), 'certificate')) {
                    $safeMsg = 'SSL/TLS certificate verification failed or handshake was rejected.';
                    $errCode = 'TLS_ERROR';
                }

                return FetchResult::failure(
                    requestedUrl: $targetUrl,
                    errorCode: $errCode,
                    errorMessage: $safeMsg,
                    responseTimeMs: $elapsedMs,
                    redirectHistory: $redirectHistory,
                    warnings: $warnings
                );
            }
        }

        $elapsedMs = (int) round((microtime(true) - $startTime) * 1000);
        return FetchResult::failure(
            requestedUrl: $targetUrl,
            errorCode: 'FETCH_LOOP_TERMINATED',
            errorMessage: 'Fetch process terminated unexpectedly.',
            responseTimeMs: $elapsedMs,
            redirectHistory: $redirectHistory
        );
    }

    /**
     * Resolve a potentially relative Location header into an absolute URL.
     */
    private function resolveRedirectUrl(string $baseUrl, string $location): string
    {
        $location = trim($location);

        // Already absolute URL
        if (preg_match('#^https?://#i', $location)) {
            return $this->validator->normalize($location);
        }

        // Protocol-relative URL (//example.com/page)
        if (str_starts_with($location, '//')) {
            $baseScheme = parse_url($baseUrl, PHP_URL_SCHEME) ?? 'https';
            return $this->validator->normalize($baseScheme . ':' . $location);
        }

        $parsedBase = parse_url($baseUrl);
        $scheme = $parsedBase['scheme'] ?? 'https';
        $host = $parsedBase['host'] ?? '';
        $port = isset($parsedBase['port']) ? ':' . $parsedBase['port'] : '';

        // Root-relative URL (/about)
        if (str_starts_with($location, '/')) {
            return "{$scheme}://{$host}{$port}{$location}";
        }

        // Path-relative URL (path/page.html)
        $basePath = $parsedBase['path'] ?? '/';
        $baseDir = rtrim(dirname($basePath), '/\\');
        $newPath = ($baseDir === '' ? '' : $baseDir) . '/' . ltrim($location, '/');

        return "{$scheme}://{$host}{$port}{$newPath}";
    }
}
