<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add webp_path to media table.
 *
 * When a HEIC/HEIF image is uploaded, Intervention Image converts it to WebP
 * and stores the path here so we can clean up the converted file on delete.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            // Path (relative to the 'public' disk) of the WebP-converted file.
            // NULL means no conversion was performed (file was already web-safe).
            $table->string('webp_path', 500)->nullable()->after('thumbnail_url');
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropColumn('webp_path');
        });
    }
};
