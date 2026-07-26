<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailVerificationCode extends Model
{
    public const PURPOSE_REGISTER = 'register';

    public const PURPOSE_EMAIL_CHANGE = 'email_change';

    public const PURPOSE_PASSWORD_RESET = 'password_reset';

    protected $fillable = [
        'email',
        'code_hash',
        'purpose',
        'attempts',
        'expires_at',
        'consumed_at',
        'ip',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
        ];
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isConsumed(): bool
    {
        return $this->consumed_at !== null;
    }

    public function isUsable(): bool
    {
        return ! $this->isConsumed() && ! $this->isExpired();
    }
}
