<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Region extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'id',
        'name',
        'slug',
        'longitude',
        'latitude',
        'langs',
        'langs_loct',
        'sort',
    ];

    protected function casts(): array
    {
        return [
            'longitude' => 'float',
            'latitude' => 'float',
            'langs' => 'array',
            'langs_loct' => 'array',
            'sort' => 'integer',
        ];
    }

    public function cities(): HasMany
    {
        return $this->hasMany(City::class);
    }
}
