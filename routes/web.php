<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::view('/', 'pages.home')->name('home');
Route::view('/catalog', 'pages.catalog')->name('catalog');
Route::view('/map', 'pages.map')->name('map');
Route::view('/property', 'pages.property')->name('property');
Route::view('/design-system', 'pages.design-system')->name('design-system');

Route::get('/auth', function () {
    if (auth()->check()) {
        return redirect()->route('account');
    }

    return view('pages.auth');
})->name('auth');

Route::middleware('auth')->group(function () {
    Route::view('/account', 'pages.account')->name('account');
    Route::view('/property-editor', 'pages.property-editor')->name('property-editor');
});

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:10,1')
        ->name('register');
    Route::post('/email/verify', [AuthController::class, 'verifyEmail'])
        ->middleware('throttle:20,1')
        ->name('email.verify');
    Route::post('/email/resend-code', [AuthController::class, 'resendCode'])
        ->middleware('throttle:10,1')
        ->name('email.resend');
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1')
        ->name('login');
    Route::post('/password/forgot', [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:5,1')
        ->name('password.forgot');
    Route::post('/password/reset', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:10,1')
        ->name('password.reset');
    Route::post('/logout', [AuthController::class, 'logout'])
        ->middleware('auth')
        ->name('logout');
    Route::get('/me', [AuthController::class, 'me'])->name('me');
});
