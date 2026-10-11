<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Audit extends Model
{
    use HasFactory;

    protected $fillable = [
        'primary_url',
        'normalized_primary_url',
        'industry',
        'target_audience',
        'main_service',
        'audit_objective',
        'status',
        'overall_score',
        'seo_score',
        'ux_score',
        'error_code',
        'safe_error_message',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'overall_score' => 'integer',
        'seo_score' => 'integer',
        'ux_score' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function websites(): HasMany
    {
        return $this->hasMany(AuditWebsite::class);
    }

    public function primaryWebsite(): HasOne
    {
        return $this->hasOne(AuditWebsite::class)->where('role', 'primary');
    }

    public function competitorWebsites(): HasMany
    {
        return $this->hasMany(AuditWebsite::class)->where('role', 'competitor');
    }

    public function issues(): HasMany
    {
        return $this->hasMany(AuditIssue::class);
    }

    public function aiReport(): HasOne
    {
        return $this->hasOne(AiReport::class);
    }
}
