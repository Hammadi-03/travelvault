<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'display_name' => ['required', 'string', 'max:100'],
            'email'        => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password'     => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name'         => $request->display_name,
            'display_name' => $request->display_name,
            'email'        => $request->email,
            'password'     => Hash::make($request->string('password')),
        ]);

        event(new Registered($user));

        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->formatUser($user),
        ], 201);
    }

    private function formatUser(User $user): array
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
