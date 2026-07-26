<?php

namespace App\Console\Commands;

use App\Services\Geo\GeoImportService;
use Illuminate\Console\Command;
use RuntimeException;
use Throwable;

class ImportGeoCommand extends Command
{
    protected $signature = 'geo:import {--force : Truncate and reimport geo tables}';

    protected $description = 'Import regions/cities/districts from geo-fetch JSON and CSV files';

    public function handle(GeoImportService $importer): int
    {
        $this->info('Starting geo import from '.base_path('geo-fetch'));

        try {
            $importer->import(force: (bool) $this->option('force'));
        } catch (RuntimeException $e) {
            $this->warn($e->getMessage());

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info('Geo import completed successfully.');

        return self::SUCCESS;
    }
}
