<?php

namespace App\Http\Requests;

use App\Services\Security\WebsiteUrlValidator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreAuditRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'primary_url' => ['required', 'string', 'max:1024', 'regex:#^(https?://)?[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(/.*)?$#i'],
            'competitor_urls' => ['nullable', 'array', 'max:2'],
            'competitor_urls.*' => ['nullable', 'string', 'max:1024', 'regex:#^(https?://)?[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,}(/.*)?$#i'],
            'industry' => ['nullable', 'string', 'max:255'],
            'target_audience' => ['nullable', 'string', 'max:255'],
            'main_service' => ['nullable', 'string', 'max:255'],
            'audit_objective' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'primary_url.required' => 'Please provide a primary website URL to audit.',
            'primary_url.regex' => 'The primary URL must be a valid website address (e.g. example.com or https://example.com).',
            'competitor_urls.*.regex' => 'Competitor URL must be a valid website address.',
            'competitor_urls.max' => 'You can compare a maximum of 2 competitors in a single audit.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $urlValidator = app(WebsiteUrlValidator::class);
            $primaryUrl = $this->input('primary_url');

            if (empty($primaryUrl)) return;

            $normalizedPrimary = $urlValidator->normalize($primaryUrl);
            $primaryDomain = $urlValidator->extractDomain($primaryUrl);

            $competitorUrls = array_filter((array) $this->input('competitor_urls', []));
            $seenDomains = [];

            foreach ($competitorUrls as $idx => $compUrl) {
                if (empty(trim($compUrl))) continue;

                $compDomain = $urlValidator->extractDomain($compUrl);

                // Prevent competitor from matching primary domain
                if ($compDomain === $primaryDomain) {
                    $validator->errors()->add("competitor_urls.{$idx}", 'Competitor URL cannot point to the same domain as the primary website.');
                }

                // Prevent duplicate competitors
                if (in_array($compDomain, $seenDomains, true)) {
                    $validator->errors()->add("competitor_urls.{$idx}", 'Duplicate competitor domain detected. Please enter unique competitor URLs.');
                }

                $seenDomains[] = $compDomain;
            }
        });
    }
}
