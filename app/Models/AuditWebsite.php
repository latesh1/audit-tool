<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AuditWebsite extends Model
{
    use HasFactory;

    protected $fillable = [
        'audit_id',
        'role',
        'original_url',
        'final_url',
        'normalized_domain',
        'fetch_status',
        'http_status',
        'response_time_ms',
        'extracted_data',
        'extraction_warnings',
    ];

    protected $casts = [
        'http_status' => 'integer',
        'response_time_ms' => 'integer',
        'extracted_data' => 'array',
        'extraction_warnings' => 'array',
    ];

    public function audit(): BelongsTo
    {
        return $this->belongsTo(Audit::class);
    }

    public function issues(): HasMany
    {
        return $this->hasMany(AuditIssue::class);
    }
}
