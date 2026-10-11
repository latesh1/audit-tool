<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_websites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audit_id')->constrained('audits')->cascadeOnDelete();
            $table->enum('role', ['primary', 'competitor'])->default('primary');
            $table->string('original_url', 1024);
            $table->string('final_url', 1024)->nullable();
            $table->string('normalized_domain', 255)->index();
            $table->string('fetch_status', 50)->default('pending'); // pending, success, failed, timeout, redirect_blocked, ssrf_blocked, http_error
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->unsignedInteger('response_time_ms')->nullable();
            $table->json('extracted_data')->nullable();
            $table->json('extraction_warnings')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_websites');
    }
};
