<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'pages.home')->name('home');
Route::view('/catalog', 'pages.catalog')->name('catalog');
Route::view('/map', 'pages.map')->name('map');
Route::view('/property', 'pages.property')->name('property');
Route::view('/auth', 'pages.auth')->name('auth');
Route::view('/account', 'pages.account')->name('account');
Route::view('/property-editor', 'pages.property-editor')->name('property-editor');
Route::view('/design-system', 'pages.design-system')->name('design-system');
