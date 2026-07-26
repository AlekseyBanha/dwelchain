<?php

namespace App\Services\Auth;

use App\Mail\AuthCodeMail;
use App\Models\EmailVerificationCode;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EmailCodeService
{
    public function issue(string $email, string $purpose, ?string $ip = null): string
    {
        $email = Str::lower(trim($email));
        $this->assertWithinRateLimits($email, $ip);
        $this->assertResendCooldown($email, $purpose);

        $plain = $this->generateCode();

        EmailVerificationCode::query()
            ->where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        EmailVerificationCode::query()->create([
            'email' => $email,
            'code_hash' => Hash::make($plain),
            'purpose' => $purpose,
            'attempts' => 0,
            'expires_at' => now()->addMinutes((int) config('dwelchain.auth.code_ttl_minutes', 10)),
            'ip' => $ip,
        ]);

        Mail::to($email)->send(new AuthCodeMail($plain, $purpose));

        return $plain;
    }

    public function verify(string $email, string $purpose, string $code): void
    {
        $email = Str::lower(trim($email));
        $code = trim($code);

        $record = EmailVerificationCode::query()
            ->where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->latest('id')
            ->first();

        if (! $record || $record->isExpired()) {
            throw ValidationException::withMessages([
                'code' => 'Код недійсний або прострочений. Запросіть новий.',
            ]);
        }

        $maxAttempts = (int) config('dwelchain.auth.max_verify_attempts', 5);

        if ($record->attempts >= $maxAttempts) {
            $record->forceFill(['consumed_at' => now()])->save();

            throw ValidationException::withMessages([
                'code' => 'Перевищено кількість спроб. Запросіть новий код.',
            ]);
        }

        if (! Hash::check($code, $record->code_hash)) {
            $record->increment('attempts');

            throw ValidationException::withMessages([
                'code' => 'Невірний код підтвердження.',
            ]);
        }

        $record->forceFill(['consumed_at' => now()])->save();
    }

    public function resendAvailableInSeconds(string $email, string $purpose): int
    {
        $email = Str::lower(trim($email));
        $cooldown = (int) config('dwelchain.auth.resend_cooldown_seconds', 60);

        $latest = EmailVerificationCode::query()
            ->where('email', $email)
            ->where('purpose', $purpose)
            ->latest('id')
            ->first();

        if (! $latest) {
            return 0;
        }

        $elapsed = $latest->created_at->diffInSeconds(now());

        return max(0, $cooldown - $elapsed);
    }

    private function assertResendCooldown(string $email, string $purpose): void
    {
        $wait = $this->resendAvailableInSeconds($email, $purpose);

        if ($wait > 0) {
            throw ValidationException::withMessages([
                'email' => "Повторне надсилання можливе через {$wait} с.",
            ]);
        }
    }

    private function assertWithinRateLimits(string $email, ?string $ip): void
    {
        $maxPerEmail = (int) config('dwelchain.auth.max_codes_per_hour', 10);
        $maxPerIp = (int) config('dwelchain.auth.max_codes_per_ip_per_hour', 60);
        $since = now()->subHour();

        $emailCount = EmailVerificationCode::query()
            ->where('email', $email)
            ->where('created_at', '>=', $since)
            ->count();

        if ($emailCount >= $maxPerEmail) {
            throw ValidationException::withMessages([
                'email' => 'Забагато запитів коду для цієї адреси. Спробуйте пізніше.',
            ]);
        }

        if ($ip && $maxPerIp > 0) {
            $ipCount = EmailVerificationCode::query()
                ->where('ip', $ip)
                ->where('created_at', '>=', $since)
                ->count();

            if ($ipCount >= $maxPerIp) {
                throw ValidationException::withMessages([
                    'email' => 'Забагато запитів коду з вашої мережі. Спробуйте пізніше.',
                ]);
            }
        }
    }

    private function generateCode(): string
    {
        $length = (int) config('dwelchain.auth.code_length', 6);
        $max = (10 ** $length) - 1;

        return str_pad((string) random_int(0, $max), $length, '0', STR_PAD_LEFT);
    }
}
