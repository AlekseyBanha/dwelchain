<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('region_id')
                ->constrained('regions')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->decimal('longitude', 10, 6)->nullable();
            $table->decimal('latitude', 10, 6)->nullable();
            $table->boolean('has_districts')->default(false);
            $table->jsonb('langs')->default('{}');
            $table->jsonb('langs_loct')->default('{}');
            $table->integer('sort')->default(9999);
        });

        DB::statement('ALTER TABLE cities ADD COLUMN location geography(Point, 4326)');
        DB::statement('ALTER TABLE cities ADD COLUMN boundaries geometry(Polygon, 4326)');
        DB::statement('CREATE INDEX city_location_idx ON cities USING gist (location)');
    }

    public function down(): void
    {
        Schema::dropIfExists('cities');
    }
};
