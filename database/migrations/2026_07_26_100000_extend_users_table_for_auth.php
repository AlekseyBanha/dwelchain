<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('city')->nullable()->after('phone');
            $table->unsignedBigInteger('city_id')->nullable()->after('city');
            $table->boolean('is_tenant')->default(true)->after('password');
            $table->boolean('is_landlord')->default(false)->after('is_tenant');
            $table->boolean('is_admin')->default(false)->after('is_landlord');
            $table->timestamp('last_login_at')->nullable()->after('remember_token');
            $table->softDeletes();

            $table->index('city_id');
            $table->index('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['city_id']);
            $table->dropIndex(['phone']);
            $table->dropSoftDeletes();
            $table->dropColumn([
                'phone',
                'city',
                'city_id',
                'is_tenant',
                'is_landlord',
                'is_admin',
                'last_login_at',
            ]);
        });
    }
};
