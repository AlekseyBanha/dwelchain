<?php

namespace Tests\Feature;

use App\Mail\AuthCodeMail;
use App\Models\EmailVerificationCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_sends_code_and_requires_verification(): void
    {
        Mail::fake();

        $response = $this->postJson('/auth/register', [
            'name' => 'Олена Тест',
            'phone' => '+380501112233',
            'email' => 'olena@example.com',
            'password' => 'password1',
            'password_confirmation' => 'password1',
            'role' => 'tenant',
            'city' => 'Київ',
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'verification_required')
            ->assertJsonPath('email', 'olena@example.com');

        $this->assertDatabaseHas('users', [
            'email' => 'olena@example.com',
            'email_verified_at' => null,
            'is_tenant' => true,
        ]);

        Mail::assertSent(AuthCodeMail::class);
        $this->assertGuest();
    }

    public function test_email_verification_logs_user_in(): void
    {
        Mail::fake();

        $this->postJson('/auth/register', [
            'name' => 'Олена Тест',
            'phone' => '+380501112233',
            'email' => 'olena@example.com',
            'password' => 'password1',
            'password_confirmation' => 'password1',
            'role' => 'tenant',
        ])->assertCreated();

        $code = $this->lastMailCode();

        $this->postJson('/auth/email/verify', [
            'email' => 'olena@example.com',
            'code' => $code,
        ])
            ->assertOk()
            ->assertJsonPath('authenticated', true)
            ->assertJsonPath('user.email', 'olena@example.com');

        $this->assertAuthenticated();
        $this->assertNotNull(User::query()->where('email', 'olena@example.com')->value('email_verified_at'));
    }

    public function test_login_with_verified_account(): void
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'password1',
        ]);

        $this->postJson('/auth/login', [
            'email' => 'user@example.com',
            'password' => 'password1',
            'remember' => true,
        ])
            ->assertOk()
            ->assertJsonPath('authenticated', true)
            ->assertJsonPath('user.id', $user->id);

        $this->assertAuthenticatedAs($user);
    }

    public function test_login_with_unverified_account_requires_code(): void
    {
        Mail::fake();

        User::factory()->unverified()->create([
            'email' => 'pending@example.com',
            'password' => 'password1',
        ]);

        $this->postJson('/auth/login', [
            'email' => 'pending@example.com',
            'password' => 'password1',
        ])
            ->assertOk()
            ->assertJsonPath('status', 'verification_required')
            ->assertJsonPath('email', 'pending@example.com');

        $this->assertGuest();
        Mail::assertSent(AuthCodeMail::class);
    }

    public function test_invalid_credentials_return_generic_error(): void
    {
        User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'password1',
        ]);

        $this->postJson('/auth/login', [
            'email' => 'user@example.com',
            'password' => 'wrong-password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_password_reset_with_code(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email' => 'reset@example.com',
            'password' => 'old-password',
        ]);

        $this->postJson('/auth/password/forgot', [
            'email' => 'reset@example.com',
        ])->assertOk();

        $code = $this->lastMailCode();

        $this->postJson('/auth/password/reset', [
            'email' => 'reset@example.com',
            'code' => $code,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
            ->assertOk()
            ->assertJsonPath('authenticated', true);

        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
        $this->assertAuthenticatedAs($user);
    }

    public function test_expired_or_invalid_code_fails(): void
    {
        Mail::fake();

        $this->postJson('/auth/register', [
            'name' => 'Олена Тест',
            'phone' => '+380501112233',
            'email' => 'olena@example.com',
            'password' => 'password1',
            'password_confirmation' => 'password1',
            'role' => 'tenant',
        ])->assertCreated();

        $this->postJson('/auth/email/verify', [
            'email' => 'olena@example.com',
            'code' => '000000',
        ])->assertUnprocessable()->assertJsonValidationErrors(['code']);

        EmailVerificationCode::query()->update([
            'expires_at' => now()->subMinute(),
        ]);

        $this->postJson('/auth/email/verify', [
            'email' => 'olena@example.com',
            'code' => $this->lastMailCode(),
        ])->assertUnprocessable()->assertJsonValidationErrors(['code']);
    }

    public function test_guest_cannot_open_account(): void
    {
        $this->get('/account')->assertRedirect('/auth');
    }

    public function test_me_endpoint_reports_guest_and_user(): void
    {
        $this->getJson('/auth/me')
            ->assertOk()
            ->assertJsonPath('authenticated', false);

        $user = User::factory()->create();
        $this->actingAs($user)
            ->getJson('/auth/me')
            ->assertOk()
            ->assertJsonPath('authenticated', true)
            ->assertJsonPath('user.email', $user->email);
    }

    private function lastMailCode(): string
    {
        /** @var AuthCodeMail $mail */
        $mail = Mail::sent(AuthCodeMail::class)->last();

        $this->assertNotNull($mail);

        return $mail->code;
    }
}
