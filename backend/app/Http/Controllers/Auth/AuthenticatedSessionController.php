<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthenticatedSessionController extends Controller
{
    public function store(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        $user  = $request->user();
        // Revoke previous SPA tokens to avoid accumulation
        $user->tokens()->where('name', 'spa')->delete();
        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->formatUser($user),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        // Revoke current token
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out']);
    }

    private function formatUser($user): array
    {
        return [
            'id'           => (string) $user->id,
            'email'        => $user->email,
            'display_name' => $user->display_name ?? $user->name,
            'avatar_url'   => $user->avatar_url,
            'created_at'   => $user->created_at?->toISOString(),
            'updated_at'   => $user->updated_at?->toISOString(),
        ];
    }
}
