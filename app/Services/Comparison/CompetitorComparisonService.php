<?php

namespace App\Services\Comparison;

use App\Services\Extraction\ExtractedWebsiteData;

class CompetitorComparisonService
{
    /**
     * Compare primary website with up to two competitors based on factual extracted metrics.
     *
     * @param ExtractedWebsiteData $primary
     * @param array<ExtractedWebsiteData> $competitors
     * @return array
     */
    public function compare(ExtractedWebsiteData $primary, array $competitors): array
    {
        $comparisonRows = [];
        $competitorSummaries = [];
        $strengths = [];
        $weaknesses = [];
        $gaps = [];

        // 1. Response Time
        $primaryResponse = $primary->responseTimeMs;
        $row = [
            'metric' => 'Server Response Time',
            'category' => 'Performance Signal',
            'primary_value' => "{$primaryResponse} ms",
            'competitors' => [],
            'status' => 'info',
        ];
        foreach ($competitors as $idx => $comp) {
            $compResponse = $comp->responseTimeMs;
            $row['competitors'][] = [
                'url' => $comp->finalUrl,
                'value' => "{$compResponse} ms",
                'comparison' => $primaryResponse < $compResponse ? 'faster' : ($primaryResponse > $compResponse ? 'slower' : 'equal')
            ];
        }
        $comparisonRows[] = $row;

        // 2. HTTPS Security
        $row = [
            'metric' => 'HTTPS Protocol',
            'category' => 'Security',
            'primary_value' => $primary->isHttps ? 'Enabled (Secure)' : 'Not Enabled (Insecure)',
            'competitors' => [],
            'status' => $primary->isHttps ? 'good' : 'warning',
        ];
        foreach ($competitors as $comp) {
            $row['competitors'][] = [
                'url' => $comp->finalUrl,
                'value' => $comp->isHttps ? 'Enabled' : 'Not Enabled',
                'comparison' => ($primary->isHttps === $comp->isHttps) ? 'same' : ($primary->isHttps ? 'better' : 'worse')
            ];
            if (!$primary->isHttps && $comp->isHttps) {
                $gaps[] = "Competitor ({$comp->finalUrl}) uses secure HTTPS while primary website is unencrypted.";
            }
        }
        $comparisonRows[] = $row;

        // 3. Title Tag
        $row = [
            'metric' => 'Page Title & Length',
            'category' => 'SEO Metadata',
            'primary_value' => $primary->title ? "{$primary->title} ({$primary->titleLength} chars)" : 'Missing',
            'competitors' => [],
            'status' => ($primary->titleLength >= 30 && $primary->titleLength <= 65) ? 'good' : 'warning',
        ];
        foreach ($competitors as $comp) {
            $row['competitors'][] = [
                'url' => $comp->finalUrl,
                'value' => $comp->title ? "{$comp->title} ({$comp->titleLength} chars)" : 'Missing',
                'comparison' => $comp->title ? 'available' : 'missing'
            ];
            if (empty($primary->title) && !empty($comp->title)) {
                $gaps[] = "Competitor has an active title tag ('{$comp->title}') while primary site is missing one.";
            }
        }
        $comparisonRows[] = $row;

        // 4. Meta Description
        $row = [
            'metric' => 'Meta Description',
            'category' => 'SEO Metadata',
            'primary_value' => $primary->metaDescription ? "{$primary->metaDescriptionLength} chars" : 'Missing',
            'competitors' => [],
            'status' => $primary->metaDescription ? 'good' : 'warning',
        ];
        foreach ($competitors as $comp) {
            $row['competitors'][] = [
                'url' => $comp->finalUrl,
                'value' => $comp->metaDescription ? "{$comp->metaDescriptionLength} chars" : 'Missing',
                'comparison' => $comp->metaDescription ? 'available' : 'missing'
            ];
            if (empty($primary->metaDescription) && !empty($comp->metaDescription)) {
                $gaps[] = "Competitor provides meta description ({$comp->metaDescriptionLength} chars) for search click-throughs.";
            }
        }
        $comparisonRows[] = $row;

        // 5. H1 Headings
        $row = [
            'metric' => 'H1 Headings',
            'category' => 'Content Structure',
            'primary_value' => count($primary->h1s) > 0 ? (count($primary->h1s) . " (e.g. '" . mb_substr($primary->h1s[0], 0, 40) . "...')") : '0 detected',
            'competitors' => [],
            'status' => count($primary->h1s) === 1 ? 'good' : 'warning',
        ];
        foreach ($competitors as $comp) {
            $row['competitors'][] = [
                'url' => $comp->finalUrl,
                'value' => count($comp->h1s) > 0 ? (count($comp->h1s) . " (e.g. '" . mb_substr($comp->h1s[0], 0, 40) . "...')") : '0 detected',
                'comparison' => count($comp->h1s) === 1 ? 'optimal' : (count($comp->h1s) === 0 ? 'missing' : 'multiple')
            ];
        }
        $comparisonRows[] = $row;

        // 6. Sub-Headings (H2 / H3)
        $row = [
            'metric' => 'Subheadings (H2 / H3)',
            'category' => 'Content Structure',
            'primary_value' => count($primary->h2s) . ' H2s, ' . count($primary->h3s) . ' H3s',
            'competitors' => [],
            'status' => (count($primary->h2s) > 0) ? 'good' : 'warning',
        ];
        foreach ($competitors as $comp) {
            $row['competitors'][] = [
                'url' => $comp->finalUrl,
                'value' => count($comp->h2s) . ' H2s, ' . count($comp->h3s) . ' H3s',
                'comparison' => 'info'
            ];
        }
        $comparisonRows[] = $row;

        // 7. Visible Word Count
        $row = [
            'metric' => 'Visible Text Word Count',
            'category' => 'Content Depth',
            'primary_value' => "{$primary->wordCount} words",
            'competitors' => [],
            'status' => $primary->wordCount >= 250 ? 'good' : 'warning',
        ];
        foreach ($competitors as $comp) {
            $row['competitors'][] = [
                'url' => $comp->finalUrl,
                'value' => "{$comp->wordCount} words",
                'comparison' => $primary->wordCount >= $comp->wordCount ? 'more_or_equal' : 'less'
            ];
            if ($primary->wordCount < 150 && $comp->wordCount > 400) {
                $gaps[] = "Primary site has low visible content depth ({$primary->wordCount} words) compared to competitor ({$comp->wordCount} words).";
            }
        }
        $comparisonRows[] = $row;

        // 8. Image Alt Coverage
        $primaryAltCoverage = $primary->totalImages > 0 ? round((($primary->totalImages - $primary->imagesMissingAlt) / $primary->totalImages) * 100) : 100;
        $row = [
            'metric' => 'Image Alt Coverage',
            'category' => 'Accessibility & SEO',
            'primary_value' => "{$primaryAltCoverage}% ({$primary->imagesMissingAlt} missing of {$primary->totalImages})",
            'competitors' => [],
            'status' => $primaryAltCoverage >= 90 ? 'good' : ($primaryAltCoverage >= 70 ? 'medium' : 'warning'),
        ];
        foreach ($competitors as $comp) {
            $compCoverage = $comp->totalImages > 0 ? round((($comp->totalImages - $comp->imagesMissingAlt) / $comp->totalImages) * 100) : 100;
            $row['competitors'][] = [
                'url' => $comp->finalUrl,
                'value' => "{$compCoverage}% ({$comp->imagesMissingAlt} missing of {$comp->totalImages})",
                'comparison' => $primaryAltCoverage >= $compCoverage ? 'better' : 'lower'
            ];
        }
        $comparisonRows[] = $row;

        // 9. Internal Links
        $row = [
            'metric' => 'Internal Link Count',
            'category' => 'Architecture',
            'primary_value' => "{$primary->internalLinkCount} links",
            'competitors' => [],
            'status' => $primary->internalLinkCount >= 5 ? 'good' : 'warning',
        ];
        foreach ($competitors as $comp) {
            $row['competitors'][] = [
                'url' => $comp->finalUrl,
                'value' => "{$comp->internalLinkCount} links",
                'comparison' => 'info'
            ];
        }
        $comparisonRows[] = $row;

        // 10. Schema Structured Data
        $primarySchema = $primary->hasStructuredData ? implode(', ', array_slice($primary->schemaTypes, 0, 3)) : 'None detected';
        $row = [
            'metric' => 'Schema Structured Data',
            'category' => 'Technical SEO',
            'primary_value' => $primarySchema,
            'competitors' => [],
            'status' => $primary->hasStructuredData ? 'good' : 'warning',
        ];
        foreach ($competitors as $comp) {
            $compSchema = $comp->hasStructuredData ? implode(', ', array_slice($comp->schemaTypes, 0, 3)) : 'None detected';
            $row['competitors'][] = [
                'url' => $comp->finalUrl,
                'value' => $compSchema,
                'comparison' => ($primary->hasStructuredData === $comp->hasStructuredData) ? 'same' : ($primary->hasStructuredData ? 'better' : 'gap')
            ];
            if (!$primary->hasStructuredData && $comp->hasStructuredData) {
                $gaps[] = "Competitor implements structured schema markup ({$compSchema}) providing enhanced SERP features.";
            }
        }
        $comparisonRows[] = $row;

        // 11. CTA Candidates
        $primaryCtas = count($primary->ctaCandidates);
        $row = [
            'metric' => 'Detected Call-to-Actions (CTAs)',
            'category' => 'Conversion UX',
            'primary_value' => $primaryCtas > 0 ? "{$primaryCtas} detected" : '0 detected',
            'competitors' => [],
            'status' => $primaryCtas > 0 ? 'good' : 'warning',
        ];
        foreach ($competitors as $comp) {
            $compCtas = count($comp->ctaCandidates);
            $row['competitors'][] = [
                'url' => $comp->finalUrl,
                'value' => $compCtas > 0 ? "{$compCtas} detected" : '0 detected',
                'comparison' => ($primaryCtas > 0 && $compCtas === 0) ? 'primary_lead' : (($primaryCtas === 0 && $compCtas > 0) ? 'gap' : 'similar')
            ];
            if ($primaryCtas === 0 && $compCtas > 0) {
                $gaps[] = "Competitor features prominent conversion triggers (e.g. '{$comp->ctaCandidates[0]['text']}') while primary site has no clear CTAs.";
            }
        }
        $comparisonRows[] = $row;

        // 12. Contact Channels
        $primaryHasContact = !empty($primary->contactInfo['emails']) || !empty($primary->contactInfo['phones']) || !empty($primary->contactInfo['contact_links']);
        $row = [
            'metric' => 'Direct Contact Info',
            'category' => 'Trust & Accessibility',
            'primary_value' => $primaryHasContact ? 'Detected' : 'None detected',
            'competitors' => [],
            'status' => $primaryHasContact ? 'good' : 'warning',
        ];
        foreach ($competitors as $comp) {
            $compHasContact = !empty($comp->contactInfo['emails']) || !empty($comp->contactInfo['phones']) || !empty($comp->contactInfo['contact_links']);
            $row['competitors'][] = [
                'url' => $comp->finalUrl,
                'value' => $compHasContact ? 'Detected' : 'None detected',
                'comparison' => 'info'
            ];
        }
        $comparisonRows[] = $row;

        // Build Competitor Specific Summaries
        foreach ($competitors as $comp) {
            $compStrengths = [];
            $compGaps = [];
            $compLimitations = [];

            if ($comp->hasStructuredData && !$primary->hasStructuredData) {
                $compStrengths[] = 'Utilizes schema structured markup';
            }
            if ($comp->imagesMissingAlt === 0 && $comp->totalImages > 0) {
                $compStrengths[] = 'Complete image alt-text coverage';
            }
            if ($comp->wordCount > 500) {
                $compStrengths[] = 'Substantial visible content depth';
            }

            if (empty($comp->metaDescription)) {
                $compGaps[] = 'Lacks a meta description tag';
            }
            if (count($comp->h1s) !== 1) {
                $compGaps[] = 'Non-optimal H1 heading structure';
            }

            if ($comp->wordCount < 100) {
                $compLimitations[] = 'Low extractable visible text (potential SPA/JS rendering)';
            }

            $competitorSummaries[] = [
                'competitor_url' => $comp->finalUrl,
                'http_status' => $comp->httpStatus,
                'response_time_ms' => $comp->responseTimeMs,
                'strengths' => $compStrengths,
                'gaps' => $compGaps,
                'limitations' => $compLimitations,
            ];
        }

        return [
            'matrix' => $comparisonRows,
            'competitor_summaries' => $competitorSummaries,
            'identified_gaps' => array_values(array_unique($gaps)),
        ];
    }
}
