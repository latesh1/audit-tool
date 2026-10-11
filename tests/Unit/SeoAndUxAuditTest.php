<?php

namespace Tests\Unit;

use App\Services\Audit\SeoAuditService;
use App\Services\Audit\WebsiteUxAuditService;
use App\Services\Extraction\ExtractedWebsiteData;
use PHPUnit\Framework\TestCase;

class SeoAndUxAuditTest extends TestCase
{
    public function test_flags_missing_title_and_h1(): void
    {
        $seoService = new SeoAuditService();
        $emptyData = new ExtractedWebsiteData(
            requestedUrl: 'https://example.com',
            finalUrl: 'https://example.com/',
            httpStatus: 200,
            responseTimeMs: 300,
            isHttps: true,
            title: null,
            titleLength: 0,
            metaDescription: null,
            metaDescriptionLength: 0,
            h1s: [],
            h2s: [],
            h3s: [],
            headingSequence: [],
            totalImages: 0,
            imagesMissingAlt: 0,
            imagesEmptyAlt: 0,
            imageAltSamples: [],
            internalLinkCount: 0,
            externalLinkCount: 0,
            internalLinkSamples: [],
            externalLinkSamples: [],
            canonicalUrl: null,
            robotsMeta: null,
            viewportMeta: null,
            htmlLang: null,
            openGraph: [],
            twitterCard: [],
            hasStructuredData: false,
            schemaTypes: [],
            wordCount: 50,
            navigationItems: [],
            ctaCandidates: [],
            contactInfo: ['emails' => [], 'phones' => [], 'contact_links' => []],
            htmlLandmarks: [],
            duplicateIds: [],
            warnings: []
        );

        $issues = $seoService->audit($emptyData);
        $ruleCodes = array_map(fn($i) => $i->ruleCode, $issues);

        $this->assertContains('SEO-TITLE-MISSING', $ruleCodes);
        $this->assertContains('SEO-DESC-MISSING', $ruleCodes);
        $this->assertContains('SEO-H1-MISSING', $ruleCodes);
        $this->assertContains('SEO-VIEWPORT-MISSING', $ruleCodes);
        $this->assertContains('SEO-NO-INTERNAL-LINKS', $ruleCodes);
    }

    public function test_flags_heading_hierarchy_skips(): void
    {
        $seoService = new SeoAuditService();
        $skipData = new ExtractedWebsiteData(
            requestedUrl: 'https://example.com',
            finalUrl: 'https://example.com/',
            httpStatus: 200,
            responseTimeMs: 300,
            isHttps: true,
            title: 'Valid Website Title Within Normal Bounds',
            titleLength: 42,
            metaDescription: 'A valid meta description that is long enough to provide useful context to search engine users.',
            metaDescriptionLength: 95,
            h1s: ['Top Heading'],
            h2s: [],
            h3s: ['Deep Subsection'],
            headingSequence: [
                ['tag' => 'h1', 'level' => 1, 'text' => 'Top Heading', 'is_empty' => false],
                ['tag' => 'h3', 'level' => 3, 'text' => 'Deep Subsection', 'is_empty' => false] // Skipped H2
            ],
            totalImages: 1,
            imagesMissingAlt: 0,
            imagesEmptyAlt: 0,
            imageAltSamples: [],
            internalLinkCount: 5,
            externalLinkCount: 0,
            internalLinkSamples: [],
            externalLinkSamples: [],
            canonicalUrl: 'https://example.com/',
            robotsMeta: null,
            viewportMeta: 'width=device-width, initial-scale=1.0',
            htmlLang: 'en',
            openGraph: ['title' => 'Sample'],
            twitterCard: [],
            hasStructuredData: true,
            schemaTypes: ['Organization'],
            wordCount: 350,
            navigationItems: [['text' => 'Home', 'href' => '/']],
            ctaCandidates: [['tag' => 'a', 'text' => 'Contact Us', 'matched_pattern' => 'contact us']],
            contactInfo: ['emails' => ['support@example.com'], 'phones' => [], 'contact_links' => []],
            htmlLandmarks: ['header' => 1, 'main' => 1, 'footer' => 1],
            duplicateIds: [],
            warnings: []
        );

        $issues = $seoService->audit($skipData);
        $ruleCodes = array_map(fn($i) => $i->ruleCode, $issues);

        $this->assertContains('SEO-HEADING-SKIP', $ruleCodes);
    }

    public function test_ux_service_flags_missing_ctas_and_lang(): void
    {
        $uxService = new WebsiteUxAuditService();
        $data = new ExtractedWebsiteData(
            requestedUrl: 'https://example.com',
            finalUrl: 'https://example.com/',
            httpStatus: 200,
            responseTimeMs: 300,
            isHttps: true,
            title: 'Title',
            titleLength: 5,
            metaDescription: null,
            metaDescriptionLength: 0,
            h1s: ['Title'],
            h2s: [],
            h3s: [],
            headingSequence: [],
            totalImages: 0,
            imagesMissingAlt: 0,
            imagesEmptyAlt: 0,
            imageAltSamples: [],
            internalLinkCount: 1,
            externalLinkCount: 0,
            internalLinkSamples: [],
            externalLinkSamples: [],
            canonicalUrl: null,
            robotsMeta: null,
            viewportMeta: null,
            htmlLang: null, // Missing lang
            openGraph: [],
            twitterCard: [],
            hasStructuredData: false,
            schemaTypes: [],
            wordCount: 100,
            navigationItems: [],
            ctaCandidates: [], // No CTAs
            contactInfo: ['emails' => [], 'phones' => [], 'contact_links' => []],
            htmlLandmarks: [],
            duplicateIds: [],
            warnings: []
        );

        $issues = $uxService->audit($data);
        $ruleCodes = array_map(fn($i) => $i->ruleCode, $issues);

        $this->assertContains('UX-CTA-MISSING', $ruleCodes);
        $this->assertContains('UX-LANG-MISSING', $ruleCodes);
        $this->assertContains('UX-VIEWPORT-MISSING', $ruleCodes);
    }
}
