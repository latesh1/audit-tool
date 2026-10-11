<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditIssue extends Model
{
    use HasFactory;

    protected $fillable = [
        'audit_id',
        'audit_website_id',
        'category',
        'rule_code',
        'title',
        'severity',
        'evidence',
        'explanation',
        'recommendation',
        'source',
    ];

    protected $casts = [
        'evidence' => 'array',
    ];

    public function audit(): BelongsTo
    {
        return $this->belongsTo(Audit::class);
    }

    public function website(): BelongsTo
    {
        return $this->belongsTo(AuditWebsite::class, 'audit_website_id');
    }
}
