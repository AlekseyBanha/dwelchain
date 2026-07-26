<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->decimal('longitude', 10, 6)->nullable();
            $table->decimal('latitude', 10, 6)->nullable();
            $table->jsonb('langs')->default('{}');
            $table->jsonb('langs_loct')->default('{}');
            $table->integer('sort')->default(9999);
        });

        DB::statement('ALTER TABLE regions ADD COLUMN location geography(Point, 4326)');
        DB::statement('ALTER TABLE regions ADD COLUMN boundaries geometry(Polygon, 4326)');
        DB::statement('CREATE INDEX region_location_idx ON regions USING gist (location)');
    }

    public function down(): void
    {
        Schema::dropIfExists('regions');
    }
};
