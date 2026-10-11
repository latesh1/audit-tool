<?php

namespace App\Services\Audit;

use App\Services\Extraction\ExtractedWebsiteData;

class SeoAuditService
{
    /**
     * Run all deterministic SEO rules against extracted website facts.
     *
     * @return array<AuditIssueDto>
     */
    public function audit(ExtractedWebsiteData $data): array
    {
        $issues = [];

        // 1. Title Checks
        if ($data->title === null) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-TITLE-MISSING',
                title: 'Missing Page Title Tag',
                severity: 'high',
                evidence: ['title' => null],
                explanation: 'Search engines rely heavily on the <title> tag to understand page topic and display search result headlines.',
                recommendation: 'Add a descriptive, keyword-relevant <title> tag between 50 and 60 characters.'
            );
        } elseif (trim($data->title) === '') {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-TITLE-EMPTY',
                title: 'Empty Page Title Tag',
                severity: 'high',
                evidence: ['title' => ''],
                explanation: 'An empty title tag prevents search engines from displaying an accurate search snippet and damages ranking relevance.',
                recommendation: 'Populate the <title> element with a unique and concise headline.'
            );
        } else {
            if ($data->titleLength < 30) {
                $issues[] = new AuditIssueDto(
                    category: 'seo',
                    ruleCode: 'SEO-TITLE-TOO-SHORT',
                    title: 'Title Tag May Be Too Short',
                    severity: 'low',
                    evidence: ['title' => $data->title, 'length' => $data->titleLength, 'recommended_range' => '30–60 characters'],
                    explanation: 'Short titles may miss valuable target keywords and fail to stand out in search engine result pages (SERPs).',
                    recommendation: 'Expand the title to 30–60 characters to include your brand name and primary value proposition.'
                );
            } elseif ($data->titleLength > 65) {
                $issues[] = new AuditIssueDto(
                    category: 'seo',
                    ruleCode: 'SEO-TITLE-TOO-LONG',
                    title: 'Title Tag Exceeds Recommended Length',
                    severity: 'low',
                    evidence: ['title' => $data->title, 'length' => $data->titleLength, 'recommended_range' => '30–60 characters'],
                    explanation: 'Titles longer than ~60 characters get truncated with an ellipsis (...) in Google desktop and mobile search snippets.',
                    recommendation: 'Condense the title to under 60 characters so the full headline remains visible.'
                );
            }
        }

        // 2. Meta Description Checks
        if ($data->metaDescription === null) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-DESC-MISSING',
                title: 'Missing Meta Description Tag',
                severity: 'high',
                evidence: ['meta_description' => null],
                explanation: 'A meta description is crucial for organic click-through rates. Without one, search engines automatically pull arbitrary page snippets.',
                recommendation: 'Add a compelling meta description tag summarizing the page contents in 120–160 characters.'
            );
        } elseif (trim($data->metaDescription) === '') {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-DESC-EMPTY',
                title: 'Empty Meta Description Tag',
                severity: 'medium',
                evidence: ['meta_description' => ''],
                explanation: 'The meta description attribute exists but contains no text.',
                recommendation: 'Provide a persuasive 120–160 character summary that invites searchers to click.'
            );
        } else {
            if ($data->metaDescriptionLength < 70) {
                $issues[] = new AuditIssueDto(
                    category: 'seo',
                    ruleCode: 'SEO-DESC-TOO-SHORT',
                    title: 'Meta Description May Be Too Short',
                    severity: 'low',
                    evidence: ['meta_description' => $data->metaDescription, 'length' => $data->metaDescriptionLength, 'recommended_range' => '120–160 characters'],
                    explanation: 'A very short meta description might not provide sufficient context or compelling reasons for users to click.',
                    recommendation: 'Expand your meta description to 120–160 characters highlighting unique value and a clear call-to-action.'
                );
            } elseif ($data->metaDescriptionLength > 165) {
                $issues[] = new AuditIssueDto(
                    category: 'seo',
                    ruleCode: 'SEO-DESC-TOO-LONG',
                    title: 'Meta Description May Be Truncated',
                    severity: 'low',
                    evidence: ['meta_description' => $data->metaDescription, 'length' => $data->metaDescriptionLength, 'recommended_range' => '120–160 characters'],
                    explanation: 'Descriptions over 160 characters will likely be cut off in search engine snippets.',
                    recommendation: 'Trim the meta description so the core message fits comfortably within 155–160 characters.'
                );
            }
        }

        // 3. Heading (H1) Checks
        $h1Count = count($data->h1s);
        if ($h1Count === 0) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-H1-MISSING',
                title: 'Missing Main Heading (H1)',
                severity: 'high',
                evidence: ['h1_count' => 0],
                explanation: 'An <h1> tag serves as the primary top-level heading for users and search crawlers to understand the subject of the document.',
                recommendation: 'Include a single descriptive <h1> heading near the top of the page content.'
            );
        } else {
            if (empty(trim($data->h1s[0]))) {
                $issues[] = new AuditIssueDto(
                    category: 'seo',
                    ruleCode: 'SEO-H1-EMPTY',
                    title: 'Empty Primary Heading (H1)',
                    severity: 'high',
                    evidence: ['h1' => ''],
                    explanation: 'The primary H1 heading element contains no visible text content.',
                    recommendation: 'Ensure your H1 tag contains clear text identifying the core topic.'
                );
            }

            if ($h1Count > 1) {
                $issues[] = new AuditIssueDto(
                    category: 'seo',
                    ruleCode: 'SEO-H1-MULTIPLE',
                    title: 'Multiple H1 Headings Detected (Advisory)',
                    severity: 'low',
                    evidence: ['h1_count' => $h1Count, 'h1_samples' => array_slice($data->h1s, 0, 3)],
                    explanation: 'While HTML5 permits multiple H1s, best practice for standard SEO and accessibility is to use exactly one primary H1 per page.',
                    recommendation: 'Reserve H1 for the main page title and structure secondary sections with H2 and H3 tags.'
                );
            }
        }

        // 4. Heading Hierarchy Skip Check (e.g., H1 -> H3 without H2)
        $previousLevel = 0;
        $hasSkippedHeading = false;
        $skipDetails = [];
        foreach ($data->headingSequence as $heading) {
            $currLevel = $heading['level'];
            if ($previousLevel > 0 && ($currLevel - $previousLevel) > 1) {
                $hasSkippedHeading = true;
                $skipDetails[] = "Jumped from H{$previousLevel} to H{$currLevel} ('{$heading['text']}')";
            }
            $previousLevel = $currLevel;
        }

        if ($hasSkippedHeading) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-HEADING-SKIP',
                title: 'Skipped Heading Levels in Document Structure',
                severity: 'medium',
                evidence: ['skipped_steps' => array_slice($skipDetails, 0, 3)],
                explanation: 'Skipping heading hierarchy levels (e.g. jumping from H1 directly to H3) confuses screen readers and weakens structural content indexing.',
                recommendation: 'Maintain sequential heading hierarchy without jumping over levels.'
            );
        }

        // 5. Image Alt Text Coverage
        if ($data->totalImages > 0) {
            if ($data->imagesMissingAlt > 0) {
                $issues[] = new AuditIssueDto(
                    category: 'seo',
                    ruleCode: 'SEO-IMG-ALT-MISSING',
                    title: 'Images Missing Alt Attributes',
                    severity: $data->imagesMissingAlt > 3 ? 'high' : 'medium',
                    evidence: [
                        'total_images' => $data->totalImages,
                        'images_missing_alt' => $data->imagesMissingAlt,
                        'samples' => $data->imageAltSamples
                    ],
                    explanation: 'Images without alt attributes cannot be indexed by image search engines and fail web accessibility standards (WCAG).',
                    recommendation: 'Add descriptive alt text describing the image subject or context for every content image.'
                );
            } elseif ($data->imagesEmptyAlt > 0 && ($data->imagesEmptyAlt / $data->totalImages) > 0.5) {
                $issues[] = new AuditIssueDto(
                    category: 'seo',
                    ruleCode: 'SEO-IMG-ALT-EMPTY',
                    title: 'High Proportion of Empty Alt Attributes',
                    severity: 'low',
                    evidence: ['empty_alt_count' => $data->imagesEmptyAlt, 'total_images' => $data->totalImages],
                    explanation: 'Empty alt="" is appropriate for purely decorative images, but meaningful photos and infographics should have descriptive text.',
                    recommendation: 'Review empty alt attributes to ensure informative images have proper descriptions.'
                );
            }
        }

        // 6. Internal Links
        if ($data->internalLinkCount === 0) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-NO-INTERNAL-LINKS',
                title: 'No Internal Links Detected on Page',
                severity: 'high',
                evidence: ['internal_link_count' => 0],
                explanation: 'Internal linking distributes PageRank/link equity and enables search bots to discover other important pages on your domain.',
                recommendation: 'Add contextual internal navigation links connecting this page to relevant services, articles, and category pages.'
            );
        }

        // 7. Canonical URL Check
        if (empty($data->canonicalUrl)) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-CANONICAL-MISSING',
                title: 'Missing Canonical Tag',
                severity: 'medium',
                evidence: ['canonical_url' => null],
                explanation: 'A canonical tag (<link rel="canonical">) prevents duplicate content issues caused by URL parameters, HTTP/HTTPS, or trailing slash variations.',
                recommendation: 'Add a self-referencing canonical tag pointing to the authoritative URL version of this page.'
            );
        }

        // 8. Mobile Viewport Meta
        if (empty($data->viewportMeta)) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-VIEWPORT-MISSING',
                title: 'Missing Mobile Viewport Meta Tag',
                severity: 'high',
                evidence: ['viewport_meta' => null],
                explanation: 'Google uses mobile-first indexing. Pages without a viewport tag render as fixed desktop layouts and get penalized in mobile search.',
                recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> in the document <head>.'
            );
        }

        // 9. Robots Meta Directive
        if (!empty($data->robotsMeta) && (str_contains(strtolower($data->robotsMeta), 'noindex') || str_contains(strtolower($data->robotsMeta), 'none'))) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-ROBOTS-NOINDEX',
                title: 'Page Blocks Search Indexing with Noindex Directive',
                severity: 'high',
                evidence: ['robots_meta' => $data->robotsMeta],
                explanation: 'The meta robots tag explicitly commands search engines not to index this page in search results.',
                recommendation: 'If this page is intended for public organic search traffic, remove the "noindex" directive.'
            );
        }

        // 10. HTTPS Protocol
        if (!$data->isHttps) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-HTTPS-NOT-USED',
                title: 'Website Not Served Over Secure HTTPS',
                severity: 'high',
                evidence: ['final_url' => $data->finalUrl],
                explanation: 'HTTPS is a confirmed Google search ranking signal and essential for user data privacy and browser trust badges.',
                recommendation: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS.'
            );
        }

        // 11. Word Count Content Depth
        if ($data->wordCount < 150) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-LOW-WORD-COUNT',
                title: 'Low Visible Text Word Count Detected',
                severity: 'medium',
                evidence: ['word_count' => $data->wordCount, 'threshold' => 150],
                explanation: 'Search crawlers require sufficient text content to evaluate relevance and topical authority. (Note: JavaScript-heavy SPAs may hide text from initial HTML fetches).',
                recommendation: 'Provide substantive server-rendered textual descriptions, service overviews, and FAQ content.'
            );
        }

        // 12. OpenGraph Social Metadata
        if (empty($data->openGraph)) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-OG-MISSING',
                title: 'Missing Open Graph (Social Sharing) Metadata',
                severity: 'low',
                evidence: ['open_graph_tags' => []],
                explanation: 'Open Graph tags (og:title, og:description, og:image) control preview cards when links are shared on LinkedIn, Facebook, Slack, and X.',
                recommendation: 'Implement standard Open Graph and Twitter card meta tags to maximize social engagement.'
            );
        }

        // 13. Schema / Structured Data
        if (!$data->hasStructuredData) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-SCHEMA-MISSING',
                title: 'No Schema.org Structured Data Detected',
                severity: 'low',
                evidence: ['has_structured_data' => false, 'schema_types' => []],
                explanation: 'Structured data (JSON-LD) enables rich search snippets, FAQs, breadcrumbs, and business knowledge graph entries.',
                recommendation: 'Implement JSON-LD schema (e.g. Organization, WebSite, Product, or LocalBusiness) to enhance SERP visibility.'
            );
        }

        // 14. Server Response Time
        if ($data->responseTimeMs > 1500) {
            $issues[] = new AuditIssueDto(
                category: 'seo',
                ruleCode: 'SEO-RESPONSE-TIME-SLOW',
                title: 'Slow Server Response Time (TTFB Indicator)',
                severity: 'medium',
                evidence: ['response_time_ms' => $data->responseTimeMs, 'recommended' => '< 800ms'],
                explanation: 'A server response time over 1.5 seconds indicates slow backend processing or lack of CDN edge caching, delaying crawl budget.',
                recommendation: 'Implement page caching, database query optimization, or an edge CDN like Cloudflare.'
            );
        }

        return $issues;
    }
}
