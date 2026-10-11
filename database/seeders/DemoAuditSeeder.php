<?php

namespace Database\Seeders;

use App\Models\AiReport;
use App\Models\Audit;
use App\Models\AuditIssue;
use App\Models\AuditWebsite;
use Illuminate\Database\Seeder;

class DemoAuditSeeder extends Seeder
{
    public function run(): void
    {
        // Sample Demo Audit 1: Digital Agency
        $audit1 = Audit::create([
            'primary_url' => 'https://savitinteractive.com',
            'normalized_primary_url' => 'https://savitinteractive.com/',
            'industry' => 'Digital Marketing & SEO',
            'target_audience' => 'Growing Enterprises & Global Brands',
            'main_service' => 'Search Marketing & Web Strategy',
            'audit_objective' => 'Audit landing page meta coverage, heading hierarchy, and comparative CTA clarity.',
            'status' => 'completed',
            'overall_score' => 92,
            'seo_score' => 95,
            'ux_score' => 88,
            'started_at' => now()->subHours(4),
            'completed_at' => now()->subHours(4)->addSeconds(3),
        ]);

        $site1 = AuditWebsite::create([
            'audit_id' => $audit1->id,
            'role' => 'primary',
            'original_url' => 'https://savitinteractive.com',
            'final_url' => 'https://savitinteractive.com/',
            'normalized_domain' => 'savitinteractive.com',
            'fetch_status' => 'success',
            'http_status' => 200,
            'response_time_ms' => 195,
            'extracted_data' => [
                'requested_url' => 'https://savitinteractive.com',
                'final_url' => 'https://savitinteractive.com/',
                'http_status' => 200,
                'response_time_ms' => 195,
                'is_https' => true,
                'title' => 'Savit Interactive - Leading Digital Marketing & SEO Agency',
                'title_length' => 58,
                'meta_description' => 'Savit Interactive provides enterprise SEO, web development, and digital marketing services worldwide.',
                'meta_description_length' => 102,
                'h1_count' => 1,
                'h1s' => ['Custom Digital Marketing Solutions That Scale'],
                'h2_count' => 4,
                'h2s' => ['Search Engine Optimization', 'Web Design & Development', 'Paid Media', 'Client Case Studies'],
                'h3_count' => 6,
                'h3s' => ['Technical Audits', 'Link Building', 'E-commerce SEO'],
                'heading_sequence' => [
                    ['tag' => 'h1', 'level' => 1, 'text' => 'Custom Digital Marketing Solutions That Scale', 'is_empty' => false],
                    ['tag' => 'h2', 'level' => 2, 'text' => 'Search Engine Optimization', 'is_empty' => false],
                    ['tag' => 'h3', 'level' => 3, 'text' => 'Technical Audits', 'is_empty' => false],
                ],
                'total_images' => 12,
                'images_missing_alt' => 0,
                'images_empty_alt' => 2,
                'image_alt_samples' => [],
                'internal_link_count' => 38,
                'external_link_count' => 8,
                'internal_link_samples' => [['href' => '/services', 'text' => 'Services']],
                'external_link_samples' => [],
                'canonical_url' => 'https://savitinteractive.com/',
                'robots_meta' => 'index, follow',
                'viewport_meta' => 'width=device-width, initial-scale=1.0',
                'html_lang' => 'en',
                'openGraph' => ['title' => 'Savit Interactive'],
                'twitterCard' => [],
                'has_structured_data' => true,
                'schema_types' => ['Organization', 'WebSite', 'Service'],
                'word_count' => 840,
                'navigation_items' => [['text' => 'About', 'href' => '/about']],
                'cta_candidates' => [['tag' => 'a', 'text' => 'Request a Quote', 'matched_pattern' => 'request a quote']],
                'contact_info' => ['emails' => ['info@savitinteractive.com'], 'phones' => ['+1-800-555-0199'], 'contact_links' => []],
                'html_landmarks' => ['header' => 1, 'nav' => 1, 'main' => 1, 'footer' => 1],
                'duplicate_ids' => [],
                'warnings' => [],
            ],
            'extraction_warnings' => [],
        ]);

        $comp1 = AuditWebsite::create([
            'audit_id' => $audit1->id,
            'role' => 'competitor',
            'original_url' => 'https://competitor-agency.example',
            'final_url' => 'https://competitor-agency.example/',
            'normalized_domain' => 'competitor-agency.example',
            'fetch_status' => 'success',
            'http_status' => 200,
            'response_time_ms' => 450,
            'extracted_data' => [
                'requested_url' => 'https://competitor-agency.example',
                'final_url' => 'https://competitor-agency.example/',
                'http_status' => 200,
                'response_time_ms' => 450,
                'is_https' => true,
                'title' => 'Digital Marketing Agency',
                'title_length' => 24,
                'meta_description' => null,
                'meta_description_length' => 0,
                'h1_count' => 2,
                'h1s' => ['Welcome', 'Our Marketing Services'],
                'h2_count' => 2,
                'h2s' => ['Services', 'About Us'],
                'h3_count' => 0,
                'h3s' => [],
                'heading_sequence' => [],
                'total_images' => 8,
                'images_missing_alt' => 4,
                'images_empty_alt' => 0,
                'image_alt_samples' => [],
                'internal_link_count' => 12,
                'external_link_count' => 2,
                'internal_link_samples' => [],
                'external_link_samples' => [],
                'canonical_url' => null,
                'robots_meta' => null,
                'viewport_meta' => 'width=device-width, initial-scale=1.0',
                'html_lang' => 'en',
                'openGraph' => [],
                'twitterCard' => [],
                'has_structured_data' => false,
                'schema_types' => [],
                'word_count' => 320,
                'navigation_items' => [],
                'cta_candidates' => [],
                'contact_info' => ['emails' => [], 'phones' => [], 'contact_links' => []],
                'html_landmarks' => ['header' => 1, 'main' => 1],
                'duplicate_ids' => [],
                'warnings' => [],
            ],
            'extraction_warnings' => [],
        ]);

        AuditIssue::create([
            'audit_id' => $audit1->id,
            'audit_website_id' => $site1->id,
            'category' => 'seo',
            'rule_code' => 'SEO-OG-MISSING',
            'title' => 'Missing Twitter Card Metadata',
            'severity' => 'low',
            'evidence' => ['twitter_card' => []],
            'explanation' => 'Twitter card tags enhance snippet previews when links are shared on X.',
            'recommendation' => 'Add <meta name="twitter:card" content="summary_large_image">.',
            'source' => 'deterministic',
        ]);

        AiReport::create([
            'audit_id' => $audit1->id,
            'provider' => 'deterministic_fallback',
            'model' => 'rule_engine_v1',
            'status' => 'fallback',
            'client_summary' => 'Audit completed for Savit Interactive. The domain exhibits strong technical foundations with optimal title tags, full image alt coverage, Schema structured data, and responsive navigation.',
            'report_json' => [
                'client_summary' => 'Audit completed for Savit Interactive. The domain exhibits strong technical foundations with optimal title tags, full image alt coverage, Schema structured data, and responsive navigation.',
                'strengths' => [
                    [
                        'title' => 'Optimal Title Tag Length & Clarity',
                        'evidence' => ['58 characters within standard 30–60 range'],
                        'explanation' => 'Search snippet display will show complete company branding without ellipsis truncation.'
                    ],
                    [
                        'title' => 'Rich Schema.org Structured Data',
                        'evidence' => ['Organization, WebSite, Service types detected'],
                        'explanation' => 'Enables Google to recognize brand entity information and render rich snippets.'
                    ],
                    [
                        'title' => '100% Image Alt Coverage',
                        'evidence' => ['All 12 images contain valid alt attributes'],
                        'explanation' => 'Maintains WCAG accessibility compliance and powers image search indexing.'
                    ]
                ],
                'weaknesses' => [
                    [
                        'title' => 'Twitter Card Meta Missing',
                        'evidence' => ['No twitter:card tags detected'],
                        'explanation' => 'Rich social preview cards on X/Twitter will fallback to standard default previews.'
                    ]
                ],
                'important_issues' => [],
                'recommendations' => [
                    [
                        'priority' => 'Low',
                        'title' => 'Add Twitter Card Tags',
                        'action' => 'Implement twitter:card and twitter:image tags for enriched social media sharing.',
                        'rationale' => 'Boosts click-through rates from social shares.'
                    ]
                ],
                'competitor_summary' => [
                    [
                        'competitor_url' => 'https://competitor-agency.example/',
                        'strengths' => ['HTTPS enabled'],
                        'gaps' => [
                            'Competitor is missing meta description tags',
                            'Competitor has 4 images missing alt attributes',
                            'Competitor lacks Schema structured markup'
                        ],
                        'limitations' => ['Lower word count (320 words vs 840 words)']
                    ]
                ],
                'comparison_matrix' => [
                    [
                        'metric' => 'Page Title & Length',
                        'category' => 'SEO Metadata',
                        'primary_value' => 'Savit Interactive - Leading Digital Marketing & SEO Agency (58 chars)',
                        'competitors' => [['url' => 'https://competitor-agency.example/', 'value' => 'Digital Marketing Agency (24 chars)', 'comparison' => 'available']],
                        'status' => 'good'
                    ],
                    [
                        'metric' => 'Meta Description',
                        'category' => 'SEO Metadata',
                        'primary_value' => '102 chars',
                        'competitors' => [['url' => 'https://competitor-agency.example/', 'value' => 'Missing', 'comparison' => 'missing']],
                        'status' => 'good'
                    ],
                    [
                        'metric' => 'Schema Structured Data',
                        'category' => 'Technical SEO',
                        'primary_value' => 'Organization, WebSite, Service',
                        'competitors' => [['url' => 'https://competitor-agency.example/', 'value' => 'None detected', 'comparison' => 'gap']],
                        'status' => 'good'
                    ]
                ],
                'identified_gaps' => [
                    'Competitor has no meta description tag while primary site provides an optimized description.',
                    'Competitor lacks structured data markup, missing search engine rich card opportunities.'
                ],
                'engine_note' => 'Generated via SiteScope Deterministic Knowledge Engine (Sample Demonstration Audit).'
            ]
        ]);
    }
}
