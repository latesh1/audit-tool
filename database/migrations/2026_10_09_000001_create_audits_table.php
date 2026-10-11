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
        Schema::create('audits', function (Blueprint $table) {
            $table->id();
            $table->string('primary_url', 1024);
            $table->string('normalized_primary_url', 1024)->index();
            $table->string('industry', 255)->nullable();
            $table->string('target_audience', 255)->nullable();
            $table->string('main_service', 255)->nullable();
            $table->text('audit_objective')->nullable();
            $table->string('status', 50)->default('queued')->index(); // queued, running, completed, partially_completed, failed
            $table->unsignedTinyInteger('overall_score')->nullable();
            $table->unsignedTinyInteger('seo_score')->nullable();
            $table->unsignedTinyInteger('ux_score')->nullable();
            $table->string('error_code', 100)->nullable();
            $table->text('safe_error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audits');
    }
};
