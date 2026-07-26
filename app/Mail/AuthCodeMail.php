<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AuthCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $purpose,
    ) {}

    public function envelope(): Envelope
    {
        $subject = match ($this->purpose) {
            'password_reset' => 'Код для відновлення пароля — Dwelchain',
            'email_change' => 'Код підтвердження нового email — Dwelchain',
            default => 'Код підтвердження email — Dwelchain',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.auth-code',
            with: [
                'code' => $this->code,
                'purpose' => $this->purpose,
                'ttlMinutes' => (int) config('dwelchain.auth.code_ttl_minutes', 10),
            ],
        );
    }
}
