<?php

namespace App\Services\Fetching;

class FetchResult
{
    public function __construct(
        public readonly bool $isSuccess,
        public readonly string $requestedUrl,
        public readonly ?string $finalUrl = null,
        public readonly ?int $httpStatus = null,
        public readonly ?int $responseTimeMs = null,
        public readonly ?string $htmlContent = null,
        public readonly ?string $contentType = null,
        public readonly ?string $errorCode = null,
        public readonly ?string $errorMessage = null,
        public readonly array $redirectHistory = [],
        public readonly array $warnings = []
    ) {}

    public static function failure(
        string $requestedUrl,
        string $errorCode,
        string $errorMessage,
        ?int $httpStatus = null,
        ?int $responseTimeMs = null,
        array $redirectHistory = [],
        array $warnings = []
    ): self {
        return new self(
            isSuccess: false,
            requestedUrl: $requestedUrl,
            finalUrl: null,
            httpStatus: $httpStatus,
            responseTimeMs: $responseTimeMs,
            htmlContent: null,
            contentType: null,
            errorCode: $errorCode,
            errorMessage: $errorMessage,
            redirectHistory: $redirectHistory,
            warnings: $warnings
        );
    }
}
