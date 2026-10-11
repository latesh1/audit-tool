<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'audit_id',
        'provider',
        'model',
        'status',
        'report_json',
        'client_summary',
        'error_code',
    ];

    protected $casts = [
        'report_json' => 'array',
    ];

    public function audit(): BelongsTo
    {
        return $this->belongsTo(Audit::class);
    }
}
