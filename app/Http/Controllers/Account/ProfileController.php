<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\ConfirmEmailChangeRequest;
use App\Http\Requests\Account\ResendEmailChangeRequest;
use App\Http\Requests\Account\UpdateProfileRequest;
use App\Models\EmailVerificationCode;
use App\Models\User;
use App\Services\Auth\EmailCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function __construct(
        private readonly EmailCodeService $codes,
    ) {}

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $name = $request->string('name')->toString();
        $phone = $request->string('phone')->toString();
        $email = $request->string('email')->toString();
        $cityName = config('dwelchain.mvp_city_name', 'Київ');
        $cityId = $this->resolveMvpCityId();

        $emailChanged = $email !== mb_strtolower((string) $user->email);

        $user->fill([
            'name' => $name,
            'phone' => $phone,
            'city' => $cityName,
            'city_id' => $cityId ?? $user->city_id,
        ]);
        $user->save();

        if (! $emailChanged) {
            return response()->json([
                'status' => 'ok',
                'message' => 'Профіль збережено.',
                'user' => $user->fresh()->toClientArray(),
                'pending_email_change' => $request->session()->get('pending_email_change'),
                'csrf_token' => csrf_token(),
            ]);
        }

        $this->assertEmailAvailable($email, $user->id);
        $this->codes->issue($email, EmailVerificationCode::PURPOSE_EMAIL_CHANGE, $request->ip());
        $request->session()->put('pending_email_change', $email);

        return response()->json([
            'status' => 'email_change_required',
            'message' => 'Контакти збережено. Підтвердіть новий email кодом із листа.',
            'email' => $email,
            'pending_email_change' => $email,
            'user' => $user->fresh()->toClientArray(),
            'resend_available_in' => $this->codes->resendAvailableInSeconds(
                $email,
                EmailVerificationCode::PURPOSE_EMAIL_CHANGE,
            ),
            'csrf_token' => csrf_token(),
        ]);
    }

    public function confirmEmailChange(ConfirmEmailChangeRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $email = $request->string('email')->toString();
        $pending = mb_strtolower((string) $request->session()->get('pending_email_change', ''));

        if ($pending !== '' && $email !== $pending) {
            throw ValidationException::withMessages([
                'email' => 'Підтвердіть саме ту адресу, на яку надіслано код.',
            ]);
        }

        if ($email === mb_strtolower((string) $user->email)) {
            throw ValidationException::withMessages([
                'email' => 'Це вже ваш поточний email.',
            ]);
        }

        $this->assertEmailAvailable($email, $user->id);
        $this->codes->verify($email, EmailVerificationCode::PURPOSE_EMAIL_CHANGE, $request->string('code')->toString());

        $user->forceFill([
            'email' => $email,
            'email_verified_at' => now(),
        ])->save();

        $request->session()->forget('pending_email_change');

        return response()->json([
            'status' => 'ok',
            'message' => 'Email підтверджено та оновлено.',
            'pending_email_change' => null,
            'user' => $user->fresh()->toClientArray(),
            'csrf_token' => csrf_token(),
        ]);
    }

    public function resendEmailChange(ResendEmailChangeRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $email = $request->string('email')->toString();
        $pending = mb_strtolower((string) $request->session()->get('pending_email_change', ''));

        if ($pending !== '' && $email !== $pending) {
            throw ValidationException::withMessages([
                'email' => 'Підтвердіть саме ту адресу, на яку надіслано код.',
            ]);
        }

        if ($email === mb_strtolower((string) $user->email)) {
            throw ValidationException::withMessages([
                'email' => 'Це вже ваш поточний email.',
            ]);
        }

        $this->assertEmailAvailable($email, $user->id);
        $this->codes->issue($email, EmailVerificationCode::PURPOSE_EMAIL_CHANGE, $request->ip());
        $request->session()->put('pending_email_change', $email);

        return response()->json([
            'status' => 'ok',
            'message' => 'Новий код надіслано на пошту.',
            'email' => $email,
            'pending_email_change' => $email,
            'resend_available_in' => $this->codes->resendAvailableInSeconds(
                $email,
                EmailVerificationCode::PURPOSE_EMAIL_CHANGE,
            ),
            'csrf_token' => csrf_token(),
        ]);
    }

    public function cancelEmailChange(): JsonResponse
    {
        request()->session()->forget('pending_email_change');

        return response()->json([
            'status' => 'ok',
            'message' => 'Зміну email скасовано.',
            'pending_email_change' => null,
            'csrf_token' => csrf_token(),
        ]);
    }

    private function assertEmailAvailable(string $email, int $ignoreUserId): void
    {
        $taken = User::query()
            ->where('email', $email)
            ->where('id', '!=', $ignoreUserId)
            ->exists();

        if ($taken) {
            throw ValidationException::withMessages([
                'email' => 'Користувач із цим email уже зареєстрований.',
            ]);
        }
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
