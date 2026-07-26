<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResendEmailCodeRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyEmailCodeRequest;
use App\Models\EmailVerificationCode;
use App\Models\User;
use App\Services\Auth\EmailCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private readonly EmailCodeService $codes,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $email = $request->string('email')->toString();
        $existing = User::query()->where('email', $email)->first();

        if ($existing?->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => 'Користувач із цим email уже зареєстрований.',
            ]);
        }

        $role = $request->string('role')->toString();
        $cityName = $request->string('city')->toString();
        $cityId = $this->resolveMvpCityId();

        $user = DB::transaction(function () use ($request, $existing, $role, $cityName, $cityId) {
            $isTenant = (bool) ($existing?->is_tenant ?? false);
            $isLandlord = (bool) ($existing?->is_landlord ?? false);

            if ($role === 'tenant') {
                $isTenant = true;
            }

            if ($role === 'landlord') {
                $isLandlord = true;
            }

            $payload = [
                'name' => $request->string('name')->toString(),
                'phone' => $request->string('phone')->toString(),
                'email' => $request->string('email')->toString(),
                'password' => $request->string('password')->toString(),
                'city' => $cityName,
                'city_id' => $cityId,
                'is_tenant' => $isTenant,
                'is_landlord' => $isLandlord,
                'email_verified_at' => null,
            ];

            if ($existing) {
                $existing->fill($payload);
                $existing->save();

                return $existing->fresh();
            }

            return User::query()->create($payload);
        });

        $this->codes->issue($user->email, EmailVerificationCode::PURPOSE_REGISTER, $request->ip());

        return response()->json([
            'status' => 'verification_required',
            'message' => 'Ми надіслали код підтвердження на вашу пошту.',
            'email' => $user->email,
            'resend_available_in' => $this->codes->resendAvailableInSeconds(
                $user->email,
                EmailVerificationCode::PURPOSE_REGISTER,
            ),
        ], 201);
    }

    public function verifyEmail(VerifyEmailCodeRequest $request): JsonResponse
    {
        $email = $request->string('email')->toString();
        $purpose = $request->input('purpose', EmailVerificationCode::PURPOSE_REGISTER);

        if ($purpose !== EmailVerificationCode::PURPOSE_REGISTER) {
            throw ValidationException::withMessages([
                'purpose' => 'Невірна мета підтвердження.',
            ]);
        }

        $user = User::query()->where('email', $email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => 'Користувача з цим email не знайдено.',
            ]);
        }

        if ($user->hasVerifiedEmail()) {
            $this->loginUser($user, true);

            return $this->sessionPayload('Email уже підтверджено.', $request);
        }

        $this->codes->verify($email, EmailVerificationCode::PURPOSE_REGISTER, $request->string('code')->toString());
        $user->markEmailAsVerified();
        $this->loginUser($user, true);

        return $this->sessionPayload('Email підтверджено. Ви увійшли в кабінет.', $request);
    }

    public function resendCode(ResendEmailCodeRequest $request): JsonResponse
    {
        $email = $request->string('email')->toString();
        $purpose = $request->input('purpose', EmailVerificationCode::PURPOSE_REGISTER);

        if (! in_array($purpose, [
            EmailVerificationCode::PURPOSE_REGISTER,
            EmailVerificationCode::PURPOSE_PASSWORD_RESET,
        ], true)) {
            throw ValidationException::withMessages([
                'purpose' => 'Невірна мета коду.',
            ]);
        }

        $user = User::query()->where('email', $email)->first();

        if ($purpose === EmailVerificationCode::PURPOSE_REGISTER) {
            if (! $user) {
                throw ValidationException::withMessages([
                    'email' => 'Користувача з цим email не знайдено.',
                ]);
            }

            if ($user->hasVerifiedEmail()) {
                throw ValidationException::withMessages([
                    'email' => 'Email уже підтверджено. Увійдіть із паролем.',
                ]);
            }
        }

        if ($purpose === EmailVerificationCode::PURPOSE_PASSWORD_RESET && ! $user) {
            return response()->json([
                'status' => 'ok',
                'message' => 'Якщо акаунт існує, код надіслано на пошту.',
                'resend_available_in' => 60,
            ]);
        }

        $this->codes->issue($email, $purpose, $request->ip());

        return response()->json([
            'status' => 'ok',
            'message' => 'Новий код надіслано на пошту.',
            'email' => $email,
            'resend_available_in' => $this->codes->resendAvailableInSeconds($email, $purpose),
        ]);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (! Auth::attempt($credentials, $remember)) {
            throw ValidationException::withMessages([
                'email' => 'Невірний email або пароль.',
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if (! $user->hasVerifiedEmail()) {
            Auth::logout();

            try {
                if ($this->codes->resendAvailableInSeconds($user->email, EmailVerificationCode::PURPOSE_REGISTER) === 0) {
                    $this->codes->issue($user->email, EmailVerificationCode::PURPOSE_REGISTER, $request->ip());
                }
            } catch (ValidationException) {
                // Rate limit — клієнт усе одно бачить крок із кодом.
            }

            return response()->json([
                'status' => 'verification_required',
                'message' => 'Підтвердіть email кодом із листа, щоб увійти.',
                'email' => $user->email,
                'resend_available_in' => $this->codes->resendAvailableInSeconds(
                    $user->email,
                    EmailVerificationCode::PURPOSE_REGISTER,
                ),
            ]);
        }

        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();

        return $this->sessionPayload('Ви успішно увійшли.', $request);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $email = $request->string('email')->toString();
        $user = User::query()->where('email', $email)->first();

        // Не розкриваємо, чи існує акаунт.
        if ($user) {
            try {
                $this->codes->issue($email, EmailVerificationCode::PURPOSE_PASSWORD_RESET, $request->ip());
            } catch (ValidationException $e) {
                if (isset($e->errors()['email'])) {
                    throw $e;
                }
            }
        }

        return response()->json([
            'status' => 'ok',
            'message' => 'Якщо акаунт існує, код для відновлення надіслано на пошту.',
            'email' => $email,
            'resend_available_in' => $user
                ? $this->codes->resendAvailableInSeconds($email, EmailVerificationCode::PURPOSE_PASSWORD_RESET)
                : 60,
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $email = $request->string('email')->toString();
        $user = User::query()->where('email', $email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'code' => 'Код недійсний або прострочений. Запросіть новий.',
            ]);
        }

        $this->codes->verify(
            $email,
            EmailVerificationCode::PURPOSE_PASSWORD_RESET,
            $request->string('code')->toString(),
        );

        $user->forceFill([
            'password' => $request->string('password')->toString(),
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        $this->loginUser($user, true);

        return $this->sessionPayload('Пароль оновлено. Ви увійшли в кабінет.', $request);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'status' => 'ok',
            'message' => 'Ви вийшли з кабінету.',
            'authenticated' => false,
            'csrf_token' => csrf_token(),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        return response()->json([
            'authenticated' => $user !== null,
            'user' => $user?->toClientArray(),
            'csrf_token' => csrf_token(),
        ]);
    }

    private function loginUser(User $user, bool $remember = false): void
    {
        Auth::login($user, $remember);
        request()->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();
    }

    private function sessionPayload(string $message, Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'status' => 'ok',
            'message' => $message,
            'authenticated' => true,
            'user' => $user->toClientArray(),
            'csrf_token' => csrf_token(),
            'redirect' => url('/account'),
        ]);
    }

    private function resolveMvpCityId(): ?int
    {
        $id = (int) config('dwelchain.mvp_city_id', 268);

        try {
            if (DB::table('cities')->where('id', $id)->exists()) {
                return $id;
            }
        } catch (\Throwable) {
            // Geo tables may be absent in some environments.
        }

        return null;
    }
}
