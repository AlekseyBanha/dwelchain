<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $min = (int) config('dwelchain.auth.password_min', 8);

        return [
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:40'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'confirmed', Password::min($min)],
            'role' => ['required', Rule::in(['tenant', 'landlord'])],
            'city' => ['nullable', 'string', 'max:120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'password.confirmed' => 'Паролі не збігаються.',
            'password.min' => 'Пароль має містити щонайменше :min символів.',
            'role.in' => 'Оберіть роль: орендар або орендодавець.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge([
                'email' => mb_strtolower(trim((string) $this->input('email'))),
            ]);
        }

        if (! $this->filled('city')) {
            $this->merge([
                'city' => config('dwelchain.mvp_city_name', 'Київ'),
            ]);
        }
    }
}
