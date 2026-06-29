<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Update display_name and/or avatar_url.
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'display_name' => ['sometimes', 'string', 'max:100'],
            'avatar_url'   => ['sometimes', 'nullable', 'string'],
        ]);

        $user = $request->user();
        $user->fill($request->only('display_name', 'avatar_url'));
        $user->save();

        return response()->json($this->format($user));
    }

    /**
     * Upload a new avatar image.
     */
    public function avatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:5120'], // 5 MB
        ]);

        $user = $request->user();
        $ext  = $request->file('avatar')->getClientOriginalExtension();
        $path = $request->file('avatar')->storeAs(
            'avatars/' . $user->id,
            'avatar.' . $ext,
            'public'
        );

        $avatarUrl = Storage::disk('public')->url($path);

        $user->avatar_url = $avatarUrl;
        $user->save();

        return response()->json(['avatar_url' => $avatarUrl]);
    }

    private function format($user): array
    {
        return [
            'id'           => $user->id,
            'email'        => $user->email,
            'display_name' => $user->display_name ?? $user->name,
            'avatar_url'   => $user->avatar_url,
            'created_at'   => $user->created_at?->toISOString(),
            'updated_at'   => $user->updated_at?->toISOString(),
        ];
    }
}
