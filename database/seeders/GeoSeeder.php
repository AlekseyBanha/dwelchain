<?php

namespace Database\Seeders;

use App\Services\Geo\GeoImportService;
use Illuminate\Database\Seeder;
use RuntimeException;
use Throwable;

class GeoSeeder extends Seeder
{
    public function run(GeoImportService $importer): void
    {
        try {
            $importer->import();
            $this->command?->info('Geo data imported.');
        } catch (RuntimeException $e) {
            $this->command?->warn($e->getMessage());
        } catch (Throwable $e) {
            $this->command?->error($e->getMessage());
            throw $e;
        }
    }
}
