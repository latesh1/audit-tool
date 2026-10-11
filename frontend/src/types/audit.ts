export type AuditStatus = 'queued' | 'running' | 'completed' | 'partially_completed' | 'failed';
export type IssueSeverity = 'high' | 'medium' | 'low';
export type IssueCategory = 'seo' | 'ux' | 'accessibility' | 'technical';

export interface AuditIssue {
  id: number;
  category: IssueCategory;
  rule_code: string;
  title: string;
  severity: IssueSeverity;
  evidence: Record<string, any> | null;
  explanation: string | null;
  recommendation: string | null;
  source: 'deterministic' | 'ai';
}

export interface ExtractedData {
  requested_url: string;
  final_url: string;
  http_status: number;
  response_time_ms: number;
  is_https: boolean;
  title: string | null;
  title_length: number;
  meta_description: string | null;
  meta_description_length: number;
  h1_count: number;
  h1s: string[];
  h2_count: number;
  h2s: string[];
  h3_count: number;
  h3s: string[];
  heading_sequence: Array<{ tag: string; level: number; text: string; is_empty: boolean }>;
  total_images: number;
  images_missing_alt: number;
  images_empty_alt: number;
  image_alt_samples: Array<{ src: string; status: string }>;
  internal_link_count: number;
  external_link_count: number;
  internal_link_samples: Array<{ href: string; text: string }>;
  external_link_samples: Array<{ href: string; text: string }>;
  canonical_url: string | null;
  robots_meta: string | null;
  viewport_meta: string | null;
  html_lang: string | null;
  open_graph: Record<string, string>;
  twitter_card: Record<string, string>;
  has_structured_data: boolean;
  schema_types: string[];
  word_count: number;
  navigation_items: Array<{ text: string; href: string }>;
  cta_candidates: Array<{ tag: string; text: string; matched_pattern: string; href?: string }>;
  contact_info: {
    emails: string[];
    phones: string[];
    contact_links: Array<{ text: string; href: string }>;
  };
  html_landmarks: Record<string, number>;
  duplicate_ids: Array<{ id: string; occurrences: number }>;
  warnings: string[];
}

export interface AuditWebsite {
  id: number;
  role: 'primary' | 'competitor';
  original_url: string;
  final_url: string | null;
  normalized_domain: string;
  fetch_status: string;
  http_status: number | null;
  response_time_ms: number | null;
  extracted_data: ExtractedData | null;
  extraction_warnings: string[];
}

export interface AiReportPayload {
  client_summary?: string;
  strengths?: Array<{ title: string; evidence: string[]; explanation: string }>;
  weaknesses?: Array<{ title: string; evidence: string[]; explanation: string }>;
  important_issues?: Array<{
    title: string;
    severity: string;
    evidence: string[];
    recommendation: string;
    source_rule_codes?: string[];
  }>;
  recommendations?: Array<{
    priority: string;
    title: string;
    action: string;
    rationale: string;
  }>;
  competitor_summary?: Array<{
    competitor_url: string;
    strengths: string[];
    gaps: string[];
    limitations: string[];
  }>;
  comparison_matrix?: Array<{
    metric: string;
    category: string;
    primary_value: string;
    competitors: Array<{ url: string; value: string; comparison: string }>;
    status: string;
  }>;
  identified_gaps?: string[];
  score_breakdown?: {
    overall_score: number;
    seo_score: number;
    ux_score: number;
    seo_penalties: number;
    ux_penalties: number;
    evaluated_checks: number;
  };
  engine_note?: string;
}

export interface AiReport {
  id: number;
  provider: string;
  model: string | null;
  status: string;
  report: AiReportPayload;
  client_summary: string | null;
  error_code: string | null;
}

export interface AuditDetail {
  id: number;
  primary_url: string;
  normalized_primary_url: string;
  industry: string | null;
  target_audience: string | null;
  main_service: string | null;
  audit_objective: string | null;
  status: AuditStatus;
  overall_score: number | null;
  seo_score: number | null;
  ux_score: number | null;
  error_code: string | null;
  safe_error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  primary_website: AuditWebsite | null;
  competitor_websites: AuditWebsite[];
  issues: AuditIssue[];
  ai_report: AiReport | null;
}

export interface AuditSummary {
  id: number;
  primary_url: string;
  normalized_domain: string;
  industry: string | null;
  status: AuditStatus;
  overall_score: number | null;
  seo_score: number | null;
  ux_score: number | null;
  competitor_count: number;
  competitor_domains: string[];
  issues_count: number;
  high_issues_count: number;
  created_at: string;
  completed_at: string | null;
}

export interface DashboardData {
  has_data: boolean;
  total_audits: number;
  successful_audits: number;
  failed_audits: number;
  average_scores: {
    overall: number | null;
    seo: number | null;
    ux: number | null;
  };
  issues_by_severity: {
    high: number;
    medium: number;
    low: number;
  };
  issues_by_category: {
    seo: number;
    ux: number;
    accessibility: number;
  };
  score_distribution: Array<{ bracket: string; count: number }>;
  recent_trends: Array<{
    audit_id: string;
    domain: string;
    overall: number;
    seo: number;
    ux: number;
    date: string;
  }>;
  recent_audits: AuditSummary[];
}

export interface AiStatusData {
  configured_provider: string;
  is_configured: boolean;
  model: string;
  fallback_active: boolean;
  supports_streaming: boolean;
  safe_notice: string;
}

export interface SystemInfoData {
  app_name: string;
  app_version: string;
  php_version: string;
  laravel_version: string;
  environment: string;
  database_driver: string;
  ssrf_protection_active: boolean;
  supported_ai_providers: string[];
}
