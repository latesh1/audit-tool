<?php

namespace App\Services\Security;

class WebsiteUrlValidator
{
    /**
     * Prohibited IP CIDR blocks (IPv4).
     */
    private const PROHIBITED_IPV4_CIDRS = [
        '0.0.0.0/8',          // Current network (only valid as source)
        '10.0.0.0/8',         // Private-Use
        '100.64.0.0/10',      // Shared Address Space (CGNAT)
        '127.0.0.0/8',        // Loopback
        '169.254.0.0/16',     // Link Local (Includes AWS/GCP/Azure Metadata 169.254.169.254)
        '172.16.0.0/12',      // Private-Use
        '192.0.0.0/24',       // IETF Protocol Assignments
        '192.0.2.0/24',       // Documentation (TEST-NET-1)
        '192.88.99.0/24',     // 6to4 Relay Anycast
        '192.168.0.0/16',     // Private-Use
        '198.18.0.0/15',      // Benchmarking
        '198.51.100.0/24',    // Documentation (TEST-NET-2)
        '203.0.113.0/24',     // Documentation (TEST-NET-3)
        '224.0.0.0/4',        // Multicast
        '240.0.0.0/4',        // Reserved
        '255.255.255.255/32', // Limited Broadcast
    ];

    /**
     * Known cloud metadata and dangerous hostnames.
     */
    private const PROHIBITED_HOSTNAMES = [
        'localhost',
        'localhost.localdomain',
        'ip6-localhost',
        'ip6-loopback',
        'metadata.google.internal',
        'metadata.internal',
        'instance-data',
        'metadata',
        '169.254.169.254',
        '100.100.100.200',
    ];

    /**
     * Normalize and validate a public website URL format.
     */
    public function normalize(string $url): string
    {
        $url = trim($url);

        // Prepend https:// only if no scheme is provided at all
        if (!preg_match('#^[a-zA-Z][a-zA-Z0-9+\-.]*://#i', $url)) {
            $url = 'https://' . $url;
        }

        $parsed = parse_url($url);
        if (!$parsed || !isset($parsed['host'])) {
            return $url;
        }

        $scheme = strtolower($parsed['scheme'] ?? 'https');
        $host = strtolower($parsed['host']);
        $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
        $path = $parsed['path'] ?? '/';
        $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';

        // Strip URL fragment for fetching/normalization
        return "{$scheme}://{$host}{$port}{$path}{$query}";
    }

    /**
     * Extract normalized domain name (e.g., example.com).
     */
    public function extractDomain(string $url): string
    {
        $parsed = parse_url($this->normalize($url));
        $host = $parsed['host'] ?? '';
        return strtolower(preg_replace('/^www\./i', '', $host));
    }

    /**
     * Perform comprehensive SSRF safety validation on a URL before making an HTTP request.
     *
     * @return array{is_safe: bool, error_code: string|null, message: string|null, resolved_ips: array<string>}
     */
    public function validateUrlSafety(string $url): array
    {
        $rawUrl = trim($url);
        $rawParsed = parse_url($rawUrl);

        // 1. Check scheme on raw URL
        if ($rawParsed && isset($rawParsed['scheme'])) {
            $rawScheme = strtolower($rawParsed['scheme']);
            if (!in_array($rawScheme, ['http', 'https'], true)) {
                return [
                    'is_safe' => false,
                    'error_code' => 'UNSUPPORTED_SCHEME',
                    'message' => 'Only HTTP and HTTPS protocols are permitted.',
                    'resolved_ips' => [],
                ];
            }
        }

        // 2. Reject embedded credentials (user:pass@host)
        if ($rawParsed && (!empty($rawParsed['user']) || !empty($rawParsed['pass']))) {
            return [
                'is_safe' => false,
                'error_code' => 'CREDENTIALS_PROHIBITED',
                'message' => 'URLs containing embedded usernames or passwords are not permitted.',
                'resolved_ips' => [],
            ];
        }

        $normalized = $this->normalize($rawUrl);
        $parsed = parse_url($normalized);

        if (!$parsed || empty($parsed['host'])) {
            return [
                'is_safe' => false,
                'error_code' => 'INVALID_URL_STRUCTURE',
                'message' => 'The URL structure could not be parsed.',
                'resolved_ips' => [],
            ];
        }

        // 3. Reject non-standard ports (Permit only 80, 443, 8080, 8443)
        if (isset($parsed['port'])) {
            $port = (int) $parsed['port'];
            if (!in_array($port, [80, 443, 8080, 8443], true)) {
                return [
                    'is_safe' => false,
                    'error_code' => 'RESTRICTED_PORT',
                    'message' => "Port {$port} is not permitted for security reasons.",
                    'resolved_ips' => [],
                ];
            }
        }

        $host = strtolower(trim($parsed['host'], '[]'));

        // 4. Prohibited hostnames check
        if (in_array($host, self::PROHIBITED_HOSTNAMES, true) || str_ends_with($host, '.localhost') || str_ends_with($host, '.local') || str_ends_with($host, '.internal')) {
            return [
                'is_safe' => false,
                'error_code' => 'PROHIBITED_DESTINATION',
                'message' => 'Localhost, private domains, and cloud metadata destinations are blocked.',
                'resolved_ips' => [],
            ];
        }

        // 5. If host is already an IP address, check directly
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            if ($this->isProhibitedIp($host)) {
                return [
                    'is_safe' => false,
                    'error_code' => 'PRIVATE_OR_RESERVED_IP',
                    'message' => 'Requests to private, loopback, or reserved IP addresses are blocked.',
                    'resolved_ips' => [$host],
                ];
            }
            return [
                'is_safe' => true,
                'error_code' => null,
                'message' => null,
                'resolved_ips' => [$host],
            ];
        }

        // 6. Resolve DNS records and validate all resolved IPs
        $resolvedIps = $this->resolveHostIps($host);

        if (empty($resolvedIps)) {
            return [
                'is_safe' => false,
                'error_code' => 'DNS_RESOLUTION_FAILED',
                'message' => 'Could not resolve the domain name through DNS.',
                'resolved_ips' => [],
            ];
        }

        foreach ($resolvedIps as $ip) {
            if ($this->isProhibitedIp($ip)) {
                return [
                    'is_safe' => false,
                    'error_code' => 'PRIVATE_OR_RESERVED_IP',
                    'message' => 'The destination host resolves to a private or reserved network address.',
                    'resolved_ips' => $resolvedIps,
                ];
            }
        }

        return [
            'is_safe' => true,
            'error_code' => null,
            'message' => null,
            'resolved_ips' => $resolvedIps,
        ];
    }

    /**
     * Resolve all IPv4 and IPv6 addresses for a hostname.
     *
     * @return array<string>
     */
    public function resolveHostIps(string $host): array
    {
        $ips = [];

        // IPv4 resolution
        $recordsA = @dns_get_record($host, DNS_A);
        if (is_array($recordsA)) {
            foreach ($recordsA as $rec) {
                if (!empty($rec['ip'])) {
                    $ips[] = $rec['ip'];
                }
            }
        }

        // IPv6 resolution
        $recordsAaaa = @dns_get_record($host, DNS_AAAA);
        if (is_array($recordsAaaa)) {
            foreach ($recordsAaaa as $rec) {
                if (!empty($rec['ipv6'])) {
                    $ips[] = $rec['ipv6'];
                }
            }
        }

        // Fallback to gethostbynamel if dns_get_record produced nothing
        if (empty($ips)) {
            $hostIps = @gethostbynamel($host);
            if (is_array($hostIps)) {
                $ips = array_merge($ips, $hostIps);
            }
        }

        return array_values(array_unique($ips));
    }

    /**
     * Check whether an IP is in a private, loopback, link-local, or reserved range.
     */
    public function isProhibitedIp(string $ip): bool
    {
        // Check IPv4
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            // Built-in PHP filter flags for private and reserved ranges
            if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return true;
            }

            // Check custom CIDRs (CGNAT 100.64.0.0/10, Cloud metadata 169.254.0.0/16, etc.)
            $long = ip2long($ip);
            if ($long === false) {
                return true;
            }

            foreach (self::PROHIBITED_IPV4_CIDRS as $cidr) {
                [$subnet, $bits] = explode('/', $cidr);
                $subnetLong = ip2long($subnet);
                $mask = -1 << (32 - (int) $bits);
                $subnetMasked = $subnetLong & $mask;
                if (($long & $mask) === $subnetMasked) {
                    return true;
                }
            }

            return false;
        }

        // Check IPv6
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return true;
            }

            $packed = inet_pton($ip);
            if ($packed === false) {
                return true;
            }

            // Check loopback (::1) and unspecified (::)
            if ($ip === '::1' || $ip === '::') {
                return true;
            }

            // Link-local (fe80::/10) -> first byte 0xfe, second byte top 2 bits 0x80
            $firstByte = ord($packed[0]);
            $secondByte = ord($packed[1]);
            if ($firstByte === 0xfe && ($secondByte & 0xc0) === 0x80) {
                return true;
            }

            // Unique local (fc00::/7) -> first byte 0xfc or 0xfd
            if (($firstByte & 0xfe) === 0xfc) {
                return true;
            }

            // IPv4-mapped IPv6 (::ffff:0:0/96)
            if (str_starts_with($packed, "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xff")) {
                $v4 = inet_ntop(substr($packed, 12));
                return $this->isProhibitedIp($v4);
            }

            return false;
        }

        return true;
    }
}
