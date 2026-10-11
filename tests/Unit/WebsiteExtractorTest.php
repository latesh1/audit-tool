<?php

namespace Tests\Unit;

use App\Services\Extraction\WebsiteExtractor;
use App\Services\Fetching\FetchResult;
use App\Services\Security\WebsiteUrlValidator;
use PHPUnit\Framework\TestCase;

class WebsiteExtractorTest extends TestCase
{
    private WebsiteExtractor $extractor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->extractor = new WebsiteExtractor(new WebsiteUrlValidator());
    }

    public function test_extracts_html_metadata_and_structure(): void
    {
        $sampleHtml = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Savit Interactive - Leading Digital Marketing & SEO Agency</title>
    <meta name="description" content="Savit Interactive provides enterprise SEO, web development, and digital marketing services worldwide.">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="canonical" href="https://savitinteractive.com/">
    <meta property="og:title" content="Savit Interactive Digital Agency">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Savit Interactive"
    }
    </script>
</head>
<body>
    <header>
        <nav>
            <a href="/about">About Us</a>
            <a href="/services">Services</a>
            <a href="https://external.com/partner">Partner Site</a>
        </nav>
    </header>
    <main>
        <h1>Custom Digital Marketing Solutions</h1>
        <h2>Search Engine Optimization</h2>
        <h3>Local SEO Services</h3>
        <p>Savit Interactive delivers high ROI digital growth campaigns tailored for modern brands.</p>
        <a href="/contact" class="btn">Get in touch</a>
        <a href="mailto:info@savitinteractive.com">info@savitinteractive.com</a>
        <a href="tel:+1234567890">+1 234 567 890</a>
        <img src="/logo.png" alt="Savit Interactive Logo">
        <img src="/banner.jpg">
    </main>
    <footer>
        <p>&copy; 2026 Savit Interactive</p>
    </footer>
</body>
</html>
HTML;

        $fetchResult = new FetchResult(
            isSuccess: true,
            requestedUrl: 'https://savitinteractive.com',
            finalUrl: 'https://savitinteractive.com/',
            httpStatus: 200,
            responseTimeMs: 240,
            htmlContent: $sampleHtml,
            contentType: 'text/html; charset=UTF-8'
        );

        $data = $this->extractor->extract($fetchResult);

        $this->assertEquals('Savit Interactive - Leading Digital Marketing & SEO Agency', $data->title);
        $this->assertEquals(58, $data->titleLength);
        $this->assertStringContainsString('Savit Interactive provides', $data->metaDescription);
        $this->assertEquals('en', $data->htmlLang);
        $this->assertEquals('https://savitinteractive.com/', $data->canonicalUrl);
        
        // Headings
        $this->assertCount(1, $data->h1s);
        $this->assertEquals('Custom Digital Marketing Solutions', $data->h1s[0]);
        $this->assertCount(1, $data->h2s);
        $this->assertCount(1, $data->h3s);

        // Images & Alt text
        $this->assertEquals(2, $data->totalImages);
        $this->assertEquals(1, $data->imagesMissingAlt);

        // Links
        $this->assertGreaterThanOrEqual(2, $data->internalLinkCount);
        $this->assertEquals(1, $data->externalLinkCount);

        // Structured Schema
        $this->assertTrue($data->hasStructuredData);
        $this->assertContains('Organization', $data->schemaTypes);

        // CTAs & Contact
        $this->assertGreaterThanOrEqual(1, count($data->ctaCandidates));
        $this->assertContains('info@savitinteractive.com', $data->contactInfo['emails']);
        $this->assertContains('+1234567890', $data->contactInfo['phones']);

        // Landmarks
        $this->assertArrayHasKey('header', $data->htmlLandmarks);
        $this->assertArrayHasKey('main', $data->htmlLandmarks);
        $this->assertArrayHasKey('footer', $data->htmlLandmarks);
    }
}
