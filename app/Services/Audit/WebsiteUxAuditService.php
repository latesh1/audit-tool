<?php

namespace App\Services\Audit;

use App\Services\Extraction\ExtractedWebsiteData;

class WebsiteUxAuditService
{
    /**
     * Run measurable HTML-derived UX and accessibility checks.
     *
     * @return array<AuditIssueDto>
     */
    public function audit(ExtractedWebsiteData $data): array
    {
        $issues = [];

        // 1. Call to Action (CTA) Detection
        if (empty($data->ctaCandidates)) {
            $issues[] = new AuditIssueDto(
                category: 'ux',
                ruleCode: 'UX-CTA-MISSING',
                title: 'No Clear Call-to-Action (CTA) Identified',
                severity: 'high',
                evidence: ['detected_ctas' => []],
                explanation: 'A measurable website conversion funnel requires visible conversion triggers (e.g., "Contact Us", "Get Started", "Book a Demo").',
                recommendation: 'Add prominent call-to-action buttons in the header, hero section, and at key content transition points.'
            );
        }

        // 2. Contact Accessibility (Email, Phone, Contact Link)
        $hasEmail = !empty($data->contactInfo['emails']);
        $hasPhone = !empty($data->contactInfo['phones']);
        $hasContactLink = !empty($data->contactInfo['contact_links']);

        if (!$hasEmail && !$hasPhone && !$hasContactLink) {
            $issues[] = new AuditIssueDto(
                category: 'ux',
                ruleCode: 'UX-CONTACT-MISSING',
                title: 'No Public Contact Channels or Links Detected',
                severity: 'medium',
                evidence: ['emails' => [], 'phones' => [], 'contact_links' => []],
                explanation: 'Users require quick, transparent ways to reach human support or sales. Missing contact details reduces user trust.',
                recommendation: 'Display a direct contact page link, business email, or telephone number prominently.'
            );
        }

        // 3. Navigation Presence
        if (empty($data->navigationItems) && ($data->htmlLandmarks['nav'] ?? 0) === 0) {
            $issues[] = new AuditIssueDto(
                category: 'ux',
                ruleCode: 'UX-NAV-MISSING',
                title: 'Missing Semantic Navigation Menu (<nav>)',
                severity: 'medium',
                evidence: ['navigation_elements' => 0, 'landmarks' => $data->htmlLandmarks],
                explanation: 'A clear navigation menu allows visitors to browse secondary offerings and navigate back to the home page easily.',
                recommendation: 'Wrap top-level menu links in a semantic <nav> landmark element.'
            );
        }

        // 4. HTML Language Attribute (Accessibility)
        if (empty($data->htmlLang)) {
            $issues[] = new AuditIssueDto(
                category: 'accessibility',
                ruleCode: 'UX-LANG-MISSING',
                title: 'Missing HTML Document Language Attribute',
                severity: 'medium',
                evidence: ['html_lang' => null],
                explanation: 'The <html lang="..."> attribute specifies the natural language of the document, required by screen readers and translation tools (WCAG 3.1.1).',
                recommendation: 'Add a lang attribute to your <html> tag (e.g. <html lang="en">).'
            );
        }

        // 5. Semantic HTML Landmarks
        $missingLandmarks = [];
        if (!isset($data->htmlLandmarks['header'])) $missingLandmarks[] = '<header>';
        if (!isset($data->htmlLandmarks['main'])) $missingLandmarks[] = '<main>';
        if (!isset($data->htmlLandmarks['footer'])) $missingLandmarks[] = '<footer>';

        if (count($missingLandmarks) >= 2) {
            $issues[] = new AuditIssueDto(
                category: 'accessibility',
                ruleCode: 'UX-LANDMARKS-MISSING',
                title: 'Missing Core Semantic HTML5 Landmark Elements',
                severity: 'low',
                evidence: ['missing_landmarks' => $missingLandmarks, 'detected' => array_keys($data->htmlLandmarks)],
                explanation: 'Landmark elements (<header>, <main>, <footer>) help assistive technology users jump directly to primary sections without navigating all markup.',
                recommendation: 'Structure your layout using HTML5 landmarks (<header>, <main role="main">, <footer>).'
            );
        }

        // 6. Duplicate HTML Element IDs
        if (!empty($data->duplicateIds)) {
            $issues[] = new AuditIssueDto(
                category: 'ux',
                ruleCode: 'UX-DUPLICATE-IDS',
                title: 'Duplicate HTML Element IDs in DOM',
                severity: 'medium',
                evidence: ['duplicates' => $data->duplicateIds],
                explanation: 'Every ID attribute on an HTML page must be unique. Duplicate IDs break JavaScript event bindings, form labels, and ARIA relationships.',
                recommendation: 'Ensure all id attributes across the template are globally unique.'
            );
        }

        // 7. Mobile Viewport Configuration
        if (empty($data->viewportMeta)) {
            $issues[] = new AuditIssueDto(
                category: 'ux',
                ruleCode: 'UX-VIEWPORT-MISSING',
                title: 'Layout Lacks Responsive Viewport Definition',
                severity: 'high',
                evidence: ['viewport' => null],
                explanation: 'Without a viewport configuration, mobile browsers default to rendering a tiny desktop resolution that requires pinch-to-zoom.',
                recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> to the page header.'
            );
        }

        return $issues;
    }
}
