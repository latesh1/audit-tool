<?php

namespace Tests\Unit;

use App\Services\Security\WebsiteUrlValidator;
use PHPUnit\Framework\TestCase;

class SsrfSecurityTest extends TestCase
{
    private WebsiteUrlValidator $validator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = new WebsiteUrlValidator();
    }

    public function test_normalizes_urls_properly(): void
    {
        $this->assertEquals('https://example.com/', $this->validator->normalize('example.com'));
        $this->assertEquals('https://example.com/test', $this->validator->normalize('https://example.com/test#fragment'));
        $this->assertEquals('http://example.com/page?query=1', $this->validator->normalize('http://EXAMPLE.com/page?query=1'));
    }

    public function test_extracts_domain_safely(): void
    {
        $this->assertEquals('example.com', $this->validator->extractDomain('https://www.example.com/sub/path'));
        $this->assertEquals('subdomain.site.org', $this->validator->extractDomain('http://subdomain.site.org:8080'));
    }

    public function test_blocks_localhost_and_loopback_destinations(): void
    {
        $resLocalhost = $this->validator->validateUrlSafety('http://localhost');
        $this->assertFalse($resLocalhost['is_safe']);
        $this->assertEquals('PROHIBITED_DESTINATION', $resLocalhost['error_code']);

        $res127 = $this->validator->validateUrlSafety('http://127.0.0.1');
        $this->assertFalse($res127['is_safe']);
        $this->assertEquals('PRIVATE_OR_RESERVED_IP', $res127['error_code']);

        $resIp6Loopback = $this->validator->validateUrlSafety('http://[::1]');
        $this->assertFalse($resIp6Loopback['is_safe']);
    }

    public function test_blocks_private_rfc1918_ip_addresses(): void
    {
        $this->assertTrue($this->validator->isProhibitedIp('10.0.0.1'));
        $this->assertTrue($this->validator->isProhibitedIp('10.255.255.254'));
        $this->assertTrue($this->validator->isProhibitedIp('172.16.0.1'));
        $this->assertTrue($this->validator->isProhibitedIp('172.31.255.254'));
        $this->assertTrue($this->validator->isProhibitedIp('192.168.1.1'));
        $this->assertTrue($this->validator->isProhibitedIp('192.168.254.254'));
    }

    public function test_blocks_cloud_metadata_ips_and_cgnat(): void
    {
        // AWS/GCP/Azure link-local metadata IP
        $this->assertTrue($this->validator->isProhibitedIp('169.254.169.254'));
        $this->assertTrue($this->validator->isProhibitedIp('169.254.1.1'));

        // CGNAT (100.64.0.0/10)
        $this->assertTrue($this->validator->isProhibitedIp('100.64.0.1'));
        $this->assertTrue($this->validator->isProhibitedIp('100.127.255.254'));

        // Cloud metadata hostnames
        $resGcpMeta = $this->validator->validateUrlSafety('http://metadata.google.internal');
        $this->assertFalse($resGcpMeta['is_safe']);
    }

    public function test_blocks_unsupported_protocols(): void
    {
        $resFtp = $this->validator->validateUrlSafety('ftp://files.example.com');
        $this->assertFalse($resFtp['is_safe']);
        $this->assertEquals('UNSUPPORTED_SCHEME', $resFtp['error_code']);

        $resFile = $this->validator->validateUrlSafety('file:///etc/passwd');
        $this->assertFalse($resFile['is_safe']);
    }

    public function test_blocks_embedded_credentials(): void
    {
        $resCreds = $this->validator->validateUrlSafety('https://admin:secret123@example.com');
        $this->assertFalse($resCreds['is_safe']);
        $this->assertEquals('CREDENTIALS_PROHIBITED', $resCreds['error_code']);
    }

    public function test_blocks_restricted_ports(): void
    {
        $resSshPort = $this->validator->validateUrlSafety('http://example.com:22');
        $this->assertFalse($resSshPort['is_safe']);
        $this->assertEquals('RESTRICTED_PORT', $resSshPort['error_code']);
    }
}
