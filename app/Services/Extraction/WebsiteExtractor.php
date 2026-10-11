<?php

namespace App\Services\Extraction;

use App\Services\Fetching\FetchResult;
use App\Services\Security\WebsiteUrlValidator;
use Symfony\Component\DomCrawler\Crawler;
use Throwable;

class WebsiteExtractor
{
    private const CTA_PATTERNS = [
        'contact us', 'get in touch', 'get started', 'book a demo', 'request a quote',
        'request quote', 'free consultation', 'schedule a call', 'start free trial',
        'sign up', 'register now', 'buy now', 'order now', 'subscribe', 'join now',
        'talk to sales', 'claim offer', 'download now', 'learn more'
    ];

    public function __construct(
        private readonly WebsiteUrlValidator $validator
    ) {}

    public function extract(FetchResult $fetchResult): ExtractedWebsiteData
    {
        $warnings = $fetchResult->warnings;
        $html = $fetchResult->htmlContent ?? '';
        $finalUrl = $fetchResult->finalUrl ?? $fetchResult->requestedUrl;
        $baseHost = parse_url($this->validator->normalize($finalUrl), PHP_URL_HOST) ?? '';
        $isHttps = str_starts_with(strtolower($finalUrl), 'https://');

        if (empty(trim($html))) {
            $warnings[] = 'The website returned an empty HTML body response.';
            return new ExtractedWebsiteData(
                requestedUrl: $fetchResult->requestedUrl,
                finalUrl: $finalUrl,
                httpStatus: $fetchResult->httpStatus ?? 0,
                responseTimeMs: $fetchResult->responseTimeMs ?? 0,
                isHttps: $isHttps,
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
                wordCount: 0,
                navigationItems: [],
                ctaCandidates: [],
                contactInfo: ['emails' => [], 'phones' => [], 'contact_links' => []],
                htmlLandmarks: [],
                duplicateIds: [],
                warnings: $warnings
            );
        }

        try {
            $crawler = new Crawler($html, $finalUrl);
        } catch (Throwable $e) {
            $warnings[] = 'HTML parsing warning: ' . $e->getMessage();
            $crawler = new Crawler('', $finalUrl);
        }

        // Title
        $title = null;
        try {
            $titleNode = $crawler->filter('title');
            if ($titleNode->count() > 0) {
                $title = trim($titleNode->first()->text());
            }
        } catch (Throwable) {}
        $titleLength = $title !== null ? mb_strlen($title) : 0;

        // Meta Description
        $metaDescription = null;
        try {
            $crawler->filter('meta')->each(function (Crawler $node) use (&$metaDescription) {
                $name = strtolower($node->attr('name') ?? '');
                if ($name === 'description' && $metaDescription === null) {
                    $metaDescription = trim($node->attr('content') ?? '');
                }
            });
        } catch (Throwable) {}
        $metaDescriptionLength = $metaDescription !== null ? mb_strlen($metaDescription) : 0;

        // Viewport Meta
        $viewportMeta = null;
        try {
            $crawler->filter('meta')->each(function (Crawler $node) use (&$viewportMeta) {
                $name = strtolower($node->attr('name') ?? '');
                if ($name === 'viewport' && $viewportMeta === null) {
                    $viewportMeta = trim($node->attr('content') ?? '');
                }
            });
        } catch (Throwable) {}

        // Robots Meta
        $robotsMeta = null;
        try {
            $crawler->filter('meta')->each(function (Crawler $node) use (&$robotsMeta) {
                $name = strtolower($node->attr('name') ?? '');
                if ($name === 'robots' && $robotsMeta === null) {
                    $robotsMeta = trim($node->attr('content') ?? '');
                }
            });
        } catch (Throwable) {}

        // Canonical URL
        $canonicalUrl = null;
        try {
            $crawler->filter('link')->each(function (Crawler $node) use (&$canonicalUrl) {
                $rel = strtolower($node->attr('rel') ?? '');
                if ($rel === 'canonical' && $canonicalUrl === null) {
                    $canonicalUrl = trim($node->attr('href') ?? '');
                }
            });
        } catch (Throwable) {}

        // HTML Lang attribute
        $htmlLang = null;
        try {
            $htmlNode = $crawler->filter('html');
            if ($htmlNode->count() > 0) {
                $htmlLang = trim($htmlNode->first()->attr('lang') ?? '');
                if ($htmlLang === '') $htmlLang = null;
            }
        } catch (Throwable) {}

        // Headings (H1, H2, H3) and Sequence
        $h1s = [];
        $h2s = [];
        $h3s = [];
        $headingSequence = [];

        try {
            $headingNodes = $crawler->filter('h1, h2, h3, h4, h5, h6');
            $headingNodes->each(function (Crawler $node) use (&$h1s, &$h2s, &$h3s, &$headingSequence) {
                $tag = strtolower($node->nodeName());
                $text = trim($node->text());
                $level = (int) substr($tag, 1);
                $headingSequence[] = [
                    'tag' => $tag,
                    'level' => $level,
                    'text' => mb_substr($text, 0, 150),
                    'is_empty' => empty($text),
                ];

                if ($tag === 'h1') {
                    $h1s[] = mb_substr($text, 0, 200);
                } elseif ($tag === 'h2' && count($h2s) < 30) {
                    $h2s[] = mb_substr($text, 0, 200);
                } elseif ($tag === 'h3' && count($h3s) < 30) {
                    $h3s[] = mb_substr($text, 0, 200);
                }
            });
        } catch (Throwable) {}

        // Images & Alt text coverage
        $totalImages = 0;
        $imagesMissingAlt = 0;
        $imagesEmptyAlt = 0;
        $imageAltSamples = [];

        try {
            $imgNodes = $crawler->filter('img');
            $totalImages = $imgNodes->count();
            $imgNodes->each(function (Crawler $node) use (&$imagesMissingAlt, &$imagesEmptyAlt, &$imageAltSamples) {
                $src = mb_substr($node->attr('src') ?? '', 0, 150);
                $hasAltAttr = $node->nodeName() !== null && $node->getNode(0)?->hasAttribute('alt');
                $altVal = $node->attr('alt');

                if (!$hasAltAttr) {
                    $imagesMissingAlt++;
                    if (count($imageAltSamples) < 5) {
                        $imageAltSamples[] = ['src' => $src, 'status' => 'missing_attribute'];
                    }
                } elseif (trim($altVal ?? '') === '') {
                    $imagesEmptyAlt++;
                    if (count($imageAltSamples) < 5) {
                        $imageAltSamples[] = ['src' => $src, 'status' => 'empty_alt'];
                    }
                }
            });
        } catch (Throwable) {}

        // Links (Internal & External)
        $internalLinks = [];
        $externalLinks = [];

        try {
            $linkNodes = $crawler->filter('a[href]');
            $linkNodes->each(function (Crawler $node) use ($baseHost, &$internalLinks, &$externalLinks) {
                $href = trim($node->attr('href') ?? '');
                $text = trim($node->text());
                if (empty($href) || str_starts_with($href, '#') || str_starts_with($href, 'javascript:') || str_starts_with($href, 'mailto:') || str_starts_with($href, 'tel:')) {
                    return;
                }

                $parsedHref = parse_url($href);
                $hrefHost = isset($parsedHref['host']) ? strtolower(preg_replace('/^www\./i', '', $parsedHref['host'])) : '';
                $cleanBaseHost = strtolower(preg_replace('/^www\./i', '', $baseHost));

                $isInternal = empty($hrefHost) || $hrefHost === $cleanBaseHost || str_ends_with($hrefHost, '.' . $cleanBaseHost);

                if ($isInternal) {
                    if (count($internalLinks) < 100) {
                        $internalLinks[] = [
                            'href' => mb_substr($href, 0, 200),
                            'text' => mb_substr($text, 0, 100),
                        ];
                    }
                } else {
                    if (count($externalLinks) < 100) {
                        $externalLinks[] = [
                            'href' => mb_substr($href, 0, 200),
                            'text' => mb_substr($text, 0, 100),
                        ];
                    }
                }
            });
        } catch (Throwable) {}

        $internalLinkCount = count($internalLinks);
        $externalLinkCount = count($externalLinks);
        $internalLinkSamples = array_slice($internalLinks, 0, 8);
        $externalLinkSamples = array_slice($externalLinks, 0, 8);

        // OpenGraph & Twitter Card metadata
        $openGraph = [];
        $twitterCard = [];
        try {
            $metaNodes = $crawler->filter('meta[property^="og:"], meta[name^="twitter:"]');
            $metaNodes->each(function (Crawler $node) use (&$openGraph, &$twitterCard) {
                $property = $node->attr('property') ?? $node->attr('name') ?? '';
                $content = $node->attr('content') ?? '';
                if (str_starts_with($property, 'og:')) {
                    $key = substr($property, 3);
                    $openGraph[$key] = mb_substr($content, 0, 300);
                } elseif (str_starts_with($property, 'twitter:')) {
                    $key = substr($property, 8);
                    $twitterCard[$key] = mb_substr($content, 0, 300);
                }
            });
        } catch (Throwable) {}

        // Structured Data (JSON-LD & Microdata)
        $hasStructuredData = false;
        $schemaTypes = [];

        try {
            $jsonLdNodes = $crawler->filter('script[type="application/ld+json"]');
            if ($jsonLdNodes->count() > 0) {
                $hasStructuredData = true;
                $jsonLdNodes->each(function (Crawler $node) use (&$schemaTypes) {
                    $rawJson = trim($node->text());
                    $decoded = json_decode($rawJson, true);
                    if (is_array($decoded)) {
                        $this->extractSchemaTypes($decoded, $schemaTypes);
                    }
                });
            }

            // Check Microdata itemscope
            $microdataNodes = $crawler->filter('[itemtype]');
            if ($microdataNodes->count() > 0) {
                $hasStructuredData = true;
                $microdataNodes->each(function (Crawler $node) use (&$schemaTypes) {
                    $typeUrl = $node->attr('itemtype') ?? '';
                    $parts = explode('/', rtrim($typeUrl, '/'));
                    $type = end($parts);
                    if (!empty($type) && !in_array($type, $schemaTypes, true)) {
                        $schemaTypes[] = $type;
                    }
                });
            }
        } catch (Throwable) {}

        // Visible Text Word Count (Excluding script, style, noscript, svg, nav, header, footer)
        $wordCount = 0;
        try {
            $htmlCopy = $html;
            $htmlCopy = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $htmlCopy);
            $htmlCopy = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $htmlCopy);
            $htmlCopy = preg_replace('/<noscript\b[^>]*>(.*?)<\/noscript>/is', '', $htmlCopy);
            $htmlCopy = preg_replace('/<svg\b[^>]*>(.*?)<\/svg>/is', '', $htmlCopy);
            $cleanText = strip_tags($htmlCopy);
            $cleanText = html_entity_decode($cleanText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $cleanText = preg_replace('/\s+/', ' ', trim($cleanText));
            $words = array_filter(explode(' ', $cleanText));
            $wordCount = count($words);

            if ($wordCount < 100) {
                $warnings[] = 'Very low visible text count detected (' . $wordCount . ' words). The site may rely heavily on client-side JavaScript rendering (SPA).';
            }
        } catch (Throwable) {}

        // Navigation Items
        $navigationItems = [];
        try {
            $navNodes = $crawler->filter('nav a, header a');
            $navNodes->each(function (Crawler $node) use (&$navigationItems) {
                $text = trim($node->text());
                $href = trim($node->attr('href') ?? '');
                if (!empty($text) && !empty($href) && count($navigationItems) < 12) {
                    $navigationItems[] = [
                        'text' => mb_substr($text, 0, 40),
                        'href' => mb_substr($href, 0, 150),
                    ];
                }
            });
        } catch (Throwable) {}

        // CTA Candidates Detection (Buttons and Links with actionable phrases)
        $ctaCandidates = [];
        try {
            $actionNodes = $crawler->filter('a, button, input[type="submit"], input[type="button"]');
            $actionNodes->each(function (Crawler $node) use (&$ctaCandidates) {
                $text = trim($node->text());
                if ($node->nodeName() === 'input') {
                    $text = trim($node->attr('value') ?? '');
                }

                if (empty($text) || mb_strlen($text) > 60) {
                    return;
                }

                $lowerText = strtolower($text);
                foreach (self::CTA_PATTERNS as $pattern) {
                    if (str_contains($lowerText, $pattern)) {
                        $ctaCandidates[] = [
                            'tag' => $node->nodeName(),
                            'text' => mb_substr($text, 0, 60),
                            'matched_pattern' => $pattern,
                            'href' => $node->attr('href') ?? null,
                        ];
                        break;
                    }
                }
            });
            $ctaCandidates = array_slice($ctaCandidates, 0, 10);
        } catch (Throwable) {}

        // Contact Information Candidates (Emails, Phones, Contact Page Links)
        $contactEmails = [];
        $contactPhones = [];
        $contactLinks = [];

        try {
            // Check mailto links
            $crawler->filter('a[href^="mailto:"]')->each(function (Crawler $node) use (&$contactEmails) {
                $href = $node->attr('href') ?? '';
                $email = trim(str_replace('mailto:', '', explode('?', $href)[0]));
                if (filter_var($email, FILTER_VALIDATE_EMAIL) && !in_array($email, $contactEmails, true)) {
                    $contactEmails[] = $email;
                }
            });

            // Check tel links
            $crawler->filter('a[href^="tel:"]')->each(function (Crawler $node) use (&$contactPhones) {
                $href = $node->attr('href') ?? '';
                $phone = trim(str_replace('tel:', '', $href));
                if (!empty($phone) && !in_array($phone, $contactPhones, true)) {
                    $contactPhones[] = $phone;
                }
            });

            // General text search for public email and phone pattern
            if (empty($contactEmails)) {
                if (preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/', $html, $matches)) {
                    foreach ($matches[0] as $match) {
                        if (!str_ends_with($match, '.png') && !str_ends_with($match, '.jpg') && !in_array($match, $contactEmails, true)) {
                            $contactEmails[] = $match;
                            if (count($contactEmails) >= 3) break;
                        }
                    }
                }
            }

            // Contact page links
            $crawler->filter('a[href]')->each(function (Crawler $node) use (&$contactLinks) {
                $href = $node->attr('href') ?? '';
                $text = strtolower(trim($node->text()));
                if (str_contains(strtolower($href), 'contact') || str_contains($text, 'contact') || str_contains($text, 'support')) {
                    if (count($contactLinks) < 3) {
                        $contactLinks[] = [
                            'text' => mb_substr($node->text(), 0, 50),
                            'href' => mb_substr($href, 0, 150),
                        ];
                    }
                }
            });
        } catch (Throwable) {}

        // HTML Landmarks
        $htmlLandmarks = [];
        try {
            $landmarkTags = ['header', 'nav', 'main', 'footer', 'aside', 'section', 'article'];
            foreach ($landmarkTags as $tag) {
                $count = $crawler->filter($tag)->count();
                if ($count > 0) {
                    $htmlLandmarks[$tag] = $count;
                }
            }
        } catch (Throwable) {}

        // Duplicate HTML IDs
        $duplicateIds = [];
        try {
            $idCounts = [];
            $crawler->filter('[id]')->each(function (Crawler $node) use (&$idCounts) {
                $id = trim($node->attr('id') ?? '');
                if (!empty($id)) {
                    $idCounts[$id] = ($idCounts[$id] ?? 0) + 1;
                }
            });
            foreach ($idCounts as $id => $cnt) {
                if ($cnt > 1 && count($duplicateIds) < 10) {
                    $duplicateIds[] = ['id' => $id, 'occurrences' => $cnt];
                }
            }
        } catch (Throwable) {}

        return new ExtractedWebsiteData(
            requestedUrl: $fetchResult->requestedUrl,
            finalUrl: $finalUrl,
            httpStatus: $fetchResult->httpStatus ?? 0,
            responseTimeMs: $fetchResult->responseTimeMs ?? 0,
            isHttps: $isHttps,
            title: $title,
            titleLength: $titleLength,
            metaDescription: $metaDescription,
            metaDescriptionLength: $metaDescriptionLength,
            h1s: $h1s,
            h2s: $h2s,
            h3s: $h3s,
            headingSequence: $headingSequence,
            totalImages: $totalImages,
            imagesMissingAlt: $imagesMissingAlt,
            imagesEmptyAlt: $imagesEmptyAlt,
            imageAltSamples: $imageAltSamples,
            internalLinkCount: $internalLinkCount,
            externalLinkCount: $externalLinkCount,
            internalLinkSamples: $internalLinkSamples,
            externalLinkSamples: $externalLinkSamples,
            canonicalUrl: $canonicalUrl,
            robotsMeta: $robotsMeta,
            viewportMeta: $viewportMeta,
            htmlLang: $htmlLang,
            openGraph: $openGraph,
            twitterCard: $twitterCard,
            hasStructuredData: $hasStructuredData,
            schemaTypes: array_values(array_unique($schemaTypes)),
            wordCount: $wordCount,
            navigationItems: $navigationItems,
            ctaCandidates: $ctaCandidates,
            contactInfo: [
                'emails' => array_slice($contactEmails, 0, 5),
                'phones' => array_slice($contactPhones, 0, 5),
                'contact_links' => $contactLinks,
            ],
            htmlLandmarks: $htmlLandmarks,
            duplicateIds: $duplicateIds,
            warnings: $warnings
        );
    }

    private function extractSchemaTypes(array $data, array &$types): void
    {
        if (isset($data['@type'])) {
            $val = $data['@type'];
            if (is_string($val)) {
                $types[] = $val;
            } elseif (is_array($val)) {
                foreach ($val as $v) {
                    if (is_string($v)) $types[] = $v;
                }
            }
        }

        if (isset($data['@graph']) && is_array($data['@graph'])) {
            foreach ($data['@graph'] as $item) {
                if (is_array($item)) {
                    $this->extractSchemaTypes($item, $types);
                }
            }
        }
    }
}
