<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '+380'.fake()->numerify('#########'),
            'city' => config('dwelchain.mvp_city_name', 'Київ'),
            'city_id' => null,
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'is_tenant' => true,
            'is_landlord' => false,
            'is_admin' => false,
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function landlord(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_tenant' => false,
            'is_landlord' => true,
        ]);
    }

    public function bothRoles(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_tenant' => true,
            'is_landlord' => true,
        ]);
    }
}
