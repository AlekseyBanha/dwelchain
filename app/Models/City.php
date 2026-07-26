<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class City extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'id',
        'region_id',
        'name',
        'slug',
        'longitude',
        'latitude',
        'has_districts',
        'langs',
        'langs_loct',
        'sort',
    ];

    protected function casts(): array
    {
        return [
            'longitude' => 'float',
            'latitude' => 'float',
            'has_districts' => 'boolean',
            'langs' => 'array',
            'langs_loct' => 'array',
            'sort' => 'integer',
        ];
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function districts(): HasMany
    {
        return $this->hasMany(District::class);
    }
}
