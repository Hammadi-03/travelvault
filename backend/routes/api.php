<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\ProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public auth routes (no CSRF — token-based)
|--------------------------------------------------------------------------
*/
Route::post('/register',        [RegisteredUserController::class, 'store']);
Route::post('/login',           [AuthenticatedSessionController::class, 'store']);
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->name('password.email');
Route::post('/reset-password',  [NewPasswordController::class, 'store'])
    ->name('password.store');

/*
|--------------------------------------------------------------------------
| Authenticated routes (Bearer token via Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

    // Current user
    Route::get('/user', function (Request $request) {
        $u = $request->user();
        return response()->json([
            'id'           => (string) $u->id,
            'email'        => $u->email,
            'display_name' => $u->display_name ?? $u->name,
            'avatar_url'   => $u->avatar_url,
            'created_at'   => $u->created_at?->toISOString(),
            'updated_at'   => $u->updated_at?->toISOString(),
        ]);
    });

    // Profile
    Route::put('/profile',         [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'avatar']);

    // Media
    Route::get('/media',           [MediaController::class, 'index']);
    Route::get('/media/search',    [MediaController::class, 'search']);
    Route::post('/media',          [MediaController::class, 'store']);
    Route::delete('/media/{id}',   [MediaController::class, 'destroy']);
});
