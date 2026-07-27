<?php

namespace Tests\Feature;

use App\Mail\AuthCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_update_profile(): void
    {
        $this->putJson('/account/profile', [
            'name' => 'Тест',
            'phone' => '+380501112233',
            'email' => 'test@example.com',
            'city' => 'Київ',
        ])->assertUnauthorized();
    }

    public function test_user_can_update_profile_without_email_change(): void
    {
        $user = User::factory()->create([
            'name' => 'Стара Назва',
            'phone' => '+380501112233',
            'email' => 'old@example.com',
            'city' => 'Київ',
        ]);

        $this->actingAs($user)
            ->putJson('/account/profile', [
                'name' => 'Нова Назва',
                'phone' => '+380509998877',
                'email' => 'old@example.com',
                'city' => 'Київ',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('user.name', 'Нова Назва')
            ->assertJsonPath('user.phone', '+380509998877')
            ->assertJsonPath('user.email', 'old@example.com');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Нова Назва',
            'phone' => '+380509998877',
            'email' => 'old@example.com',
        ]);
    }

    public function test_email_change_requires_verification_code(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'name' => 'Олена Тест',
            'phone' => '+380501112233',
            'email' => 'old@example.com',
        ]);

        $this->actingAs($user)
            ->putJson('/account/profile', [
                'name' => 'Олена Тест',
                'phone' => '+380501112233',
                'email' => 'new@example.com',
                'city' => 'Київ',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'email_change_required')
            ->assertJsonPath('email', 'new@example.com')
            ->assertJsonPath('pending_email_change', 'new@example.com')
            ->assertJsonPath('user.email', 'old@example.com');

        $this->assertEquals('new@example.com', session('pending_email_change'));

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'old@example.com',
        ]);

        Mail::assertSent(AuthCodeMail::class, fn (AuthCodeMail $mail) => $mail->purpose === 'email_change');

        $code = $this->lastMailCode();

        $this->actingAs($user)
            ->postJson('/account/profile/email/confirm', [
                'email' => 'new@example.com',
                'code' => $code,
            ])
            ->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('user.email', 'new@example.com')
            ->assertJsonPath('pending_email_change', null);

        $this->assertNull(session('pending_email_change'));

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'new@example.com',
        ]);
    }

    public function test_can_cancel_pending_email_change(): void
    {
        Mail::fake();

        $user = User::factory()->create(['email' => 'keep@example.com']);

        $this->actingAs($user)
            ->putJson('/account/profile', [
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => 'temp@example.com',
                'city' => 'Київ',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'email_change_required');

        $this->actingAs($user)
            ->postJson('/account/profile/email/cancel')
            ->assertOk()
            ->assertJsonPath('pending_email_change', null);

        $this->assertNull(session('pending_email_change'));
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'keep@example.com',
        ]);
    }

    public function test_cannot_change_email_to_existing_address(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->create(['email' => 'mine@example.com']);

        $this->actingAs($user)
            ->putJson('/account/profile', [
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => 'taken@example.com',
                'city' => 'Київ',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_can_resend_email_change_code(): void
    {
        Mail::fake();

        $user = User::factory()->create(['email' => 'old@example.com']);

        $this->actingAs($user)
            ->putJson('/account/profile', [
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => 'fresh@example.com',
                'city' => 'Київ',
            ])
            ->assertOk();

        // Bypass resend cooldown for the test.
        \App\Models\EmailVerificationCode::query()->update([
            'created_at' => now()->subMinutes(2),
        ]);

        $this->actingAs($user)
            ->postJson('/account/profile/email/resend', [
                'email' => 'fresh@example.com',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'ok');

        $this->assertGreaterThanOrEqual(2, Mail::sent(AuthCodeMail::class)->count());
    }

    private function lastMailCode(): string
    {
        /** @var AuthCodeMail $mail */
        $mail = Mail::sent(AuthCodeMail::class)->last();

        $this->assertNotNull($mail);

        return $mail->code;
    }
}
