<?php

namespace App\Services\Geo;

use Illuminate\Support\Facades\DB;
use RuntimeException;

class GeoImportService
{
    private readonly string $basePath;

    public function __construct(?string $basePath = null)
    {
        $this->basePath = $basePath ?? base_path('geo-fetch');
    }

    public function import(bool $force = false): void
    {
        if (! $force && $this->alreadyImported()) {
            throw new RuntimeException('Geo data already imported. Use --force to reimport.');
        }

        if ($force) {
            $this->truncate();
        }

        $this->importRegionsFromJson();
        $this->importCitiesFromJson();
        $this->importDistrictsFromJson();

        $this->updateRegionsFromCsv();
        $this->updateCitiesFromCsv();
        $this->updateDistrictsFromCsv();

        $this->resetSequences();
    }

    public function alreadyImported(): bool
    {
        return DB::table('regions')->exists()
            || DB::table('cities')->exists()
            || DB::table('districts')->exists();
    }

    private function truncate(): void
    {
        DB::statement('TRUNCATE TABLE districts, cities, regions RESTART IDENTITY CASCADE');
    }

    private function importRegionsFromJson(): void
    {
        $payload = $this->readJson('regions.json');
        $rows = $payload['data'] ?? [];

        foreach ($rows as $row) {
            DB::table('regions')->insert([
                'id' => $row['id'],
                'name' => $row['name'],
                'slug' => $row['slug'],
                'langs' => json_encode($this->buildLangs($row), JSON_UNESCAPED_UNICODE),
                'langs_loct' => json_encode($this->buildLangsLoct($row), JSON_UNESCAPED_UNICODE),
                'sort' => 9999,
            ]);
        }
    }

    private function importCitiesFromJson(): void
    {
        $rows = $this->readJson('cities.json');

        foreach (array_chunk($rows, 250) as $chunk) {
            $values = [];
            $bindings = [];

            foreach ($chunk as $row) {
                $longitude = $row['longitude'] ?? null;
                $latitude = $row['latitude'] ?? null;
                $hasPoint = $longitude !== null && $latitude !== null;

                $values[] = $hasPoint
                    ? '(?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography)'
                    : '(?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, NULL)';

                array_push(
                    $bindings,
                    $row['id'],
                    $row['region_id'],
                    $row['name'],
                    $row['slug'],
                    $longitude,
                    $latitude,
                    (bool) ($row['has_districts'] ?? false),
                    json_encode($this->buildLangs($row), JSON_UNESCAPED_UNICODE),
                    json_encode($this->buildLangsLoct($row), JSON_UNESCAPED_UNICODE),
                    9999,
                );

                if ($hasPoint) {
                    $bindings[] = $longitude;
                    $bindings[] = $latitude;
                }
            }

            DB::insert(
                'INSERT INTO cities (
                    id, region_id, name, slug, longitude, latitude, has_districts,
                    langs, langs_loct, sort, location
                ) VALUES '.implode(', ', $values),
                $bindings
            );
        }
    }

    private function importDistrictsFromJson(): void
    {
        $rows = $this->readJson('districts.json');

        foreach (array_chunk($rows, 250) as $chunk) {
            $values = [];
            $bindings = [];

            foreach ($chunk as $row) {
                $longitude = $row['longitude'] ?? null;
                $latitude = $row['latitude'] ?? null;
                $hasPoint = $longitude !== null && $latitude !== null;

                $values[] = $hasPoint
                    ? '(?, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography)'
                    : '(?, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, NULL)';

                array_push(
                    $bindings,
                    $row['id'],
                    $row['city_id'],
                    $row['name'],
                    $row['slug'],
                    $longitude,
                    $latitude,
                    json_encode($this->buildLangs($row), JSON_UNESCAPED_UNICODE),
                    json_encode($this->buildLangsLoct($row), JSON_UNESCAPED_UNICODE),
                    9999,
                );

                if ($hasPoint) {
                    $bindings[] = $longitude;
                    $bindings[] = $latitude;
                }
            }

            DB::insert(
                'INSERT INTO districts (
                    id, city_id, name, slug, longitude, latitude,
                    langs, langs_loct, sort, location
                ) VALUES '.implode(', ', $values),
                $bindings
            );
        }
    }

    private function updateRegionsFromCsv(): void
    {
        foreach ($this->readCsv('regions.csv') as $record) {
            if (count($record) < 7) {
                continue;
            }

            $id = (int) $record[0];
            if ($id <= 0) {
                continue;
            }

            $longitude = $this->nullableFloat($record[3]);
            $latitude = $this->nullableFloat($record[4]);
            $locationHex = trim((string) $record[5]);
            $boundariesHex = trim((string) $record[6]);

            $sets = [];
            $bindings = [];

            if ($longitude !== null && $latitude !== null) {
                $sets[] = 'longitude = ?';
                $sets[] = 'latitude = ?';
                $bindings[] = $longitude;
                $bindings[] = $latitude;
            }

            if ($locationHex !== '') {
                $sets[] = 'location = ST_GeogFromWKB(decode(?, \'hex\'))';
                $bindings[] = $locationHex;
            }

            if ($boundariesHex !== '') {
                $sets[] = 'boundaries = ST_GeomFromEWKB(decode(?, \'hex\'))';
                $bindings[] = $boundariesHex;
            }

            if ($sets === []) {
                continue;
            }

            $bindings[] = $id;
            DB::update('UPDATE regions SET '.implode(', ', $sets).' WHERE id = ?', $bindings);
        }
    }

    private function updateCitiesFromCsv(): void
    {
        foreach ($this->readCsv('cities.csv') as $record) {
            if (count($record) < 9) {
                continue;
            }

            $id = (int) $record[0];
            if ($id <= 0) {
                continue;
            }

            $boundariesHex = trim((string) $record[8]);
            if ($boundariesHex === '') {
                continue;
            }

            DB::update(
                'UPDATE cities SET boundaries = ST_GeomFromEWKB(decode(?, \'hex\')) WHERE id = ?',
                [$boundariesHex, $id]
            );
        }
    }

    private function updateDistrictsFromCsv(): void
    {
        foreach ($this->readCsv('districts2.csv') as $record) {
            if (count($record) < 8) {
                continue;
            }

            $id = (int) $record[0];
            if ($id <= 0) {
                continue;
            }

            $boundariesHex = trim((string) $record[7]);
            if ($boundariesHex === '') {
                continue;
            }

            DB::update(
                'UPDATE districts SET boundaries = ST_GeomFromEWKB(decode(?, \'hex\')) WHERE id = ?',
                [$boundariesHex, $id]
            );
        }
    }

    private function resetSequences(): void
    {
        foreach (['regions', 'cities', 'districts'] as $table) {
            DB::statement("
                SELECT setval(
                    pg_get_serial_sequence('{$table}', 'id'),
                    COALESCE((SELECT MAX(id) FROM {$table}), 1)
                )
            ");
        }
    }

    /**
     * @return array<string, mixed>|list<array<string, mixed>>
     */
    private function readJson(string $filename): array
    {
        $path = $this->basePath.DIRECTORY_SEPARATOR.$filename;
        if (! is_file($path)) {
            throw new RuntimeException("Geo file not found: {$path}");
        }

        $decoded = json_decode((string) file_get_contents($path), true);
        if (! is_array($decoded)) {
            throw new RuntimeException("Invalid JSON in {$path}");
        }

        return $decoded;
    }

    /**
     * @return \Generator<int, list<string>>
     */
    private function readCsv(string $filename): \Generator
    {
        $path = $this->basePath.DIRECTORY_SEPARATOR.$filename;
        if (! is_file($path)) {
            throw new RuntimeException("Geo file not found: {$path}");
        }

        $handle = fopen($path, 'rb');
        if ($handle === false) {
            throw new RuntimeException("Unable to open {$path}");
        }

        try {
            $first = fgetcsv($handle);
            if ($first === false) {
                return;
            }

            // Skip header only when the first cell is not a numeric id.
            if (! ctype_digit(trim((string) $first[0]))) {
                // header row
            } else {
                yield $first;
            }

            while (($row = fgetcsv($handle)) !== false) {
                yield $row;
            }
        } finally {
            fclose($handle);
        }
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, array{name: string}>
     */
    private function buildLangs(array $row): array
    {
        $langs = [];

        if (! empty($row['name'])) {
            $langs['uk'] = ['name' => (string) $row['name']];
        }

        if (! empty($row['ru']['name'])) {
            $langs['ru'] = ['name' => (string) $row['ru']['name']];
        }

        return $langs;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, array{name: string}>
     */
    private function buildLangsLoct(array $row): array
    {
        $langsLoct = [];

        $ua = trim((string) ($row['langs_loct_ua'] ?? ''));
        if ($ua !== '') {
            $langsLoct['uk'] = ['name' => $ua];
        }

        $ru = trim((string) ($row['langs_loct_ru'] ?? ''));
        if ($ru !== '') {
            $langsLoct['ru'] = ['name' => $ru];
        }

        return $langsLoct;
    }

    private function nullableFloat(mixed $value): ?float
    {
        $value = trim((string) $value);
        if ($value === '' || ! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }
}
