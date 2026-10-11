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
        Schema::create('audit_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audit_id')->constrained('audits')->cascadeOnDelete();
            $table->foreignId('audit_website_id')->nullable()->constrained('audit_websites')->cascadeOnDelete();
            $table->string('category', 50); // seo, ux, accessibility, technical
            $table->string('rule_code', 50)->index();
            $table->string('title', 255);
            $table->enum('severity', ['high', 'medium', 'low'])->default('medium');
            $table->json('evidence')->nullable();
            $table->text('explanation')->nullable();
            $table->text('recommendation')->nullable();
            $table->enum('source', ['deterministic', 'ai'])->default('deterministic');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_issues');
    }
};
