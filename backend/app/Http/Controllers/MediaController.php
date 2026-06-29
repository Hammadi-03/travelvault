<?php

namespace App\Http\Controllers;

use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    private const PAGE_SIZE = 20;

    /**
     * Paginated list of all media (newest first).
     */
    public function index(Request $request): JsonResponse
    {
        $page   = max(0, (int) $request->query('page', 0));
        $offset = $page * self::PAGE_SIZE;

        $items = Media::with('uploader:id,display_name,avatar_url,email')
            ->orderByDesc('created_at')
            ->skip($offset)
            ->take(self::PAGE_SIZE)
            ->get();

        return response()->json($items->map(fn ($m) => $this->format($m)));
    }

    /**
     * Search media by filename and/or file type.
     */
    public function search(Request $request): JsonResponse
    {
        $page     = max(0, (int) $request->query('page', 0));
        $offset   = $page * self::PAGE_SIZE;
        $q        = trim((string) $request->query('q', ''));
        $fileType = $request->query('file_type', 'all');

        $query = Media::with('uploader:id,display_name,avatar_url,email')
            ->orderByDesc('created_at');

        if ($q !== '') {
            $query->where('file_name', 'like', '%' . $q . '%');
        }

        if (in_array($fileType, ['image', 'video'], true)) {
            $query->where('file_type', $fileType);
        }

        $total = $query->count();
        $items = $query->skip($offset)->take(self::PAGE_SIZE)->get();

        return response()->json([
            'total' => $total,
            'items' => $items->map(fn ($m) => $this->format($m)),
        ]);
    }

    /**
     * Upload a new media file.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file'     => ['required', 'file', 'max:512000'], // 500 MB in KB
            'width'    => ['nullable', 'integer'],
            'height'   => ['nullable', 'integer'],
            'duration' => ['nullable', 'numeric'],
        ]);

        $file     = $request->file('file');
        $mimeType = $file->getMimeType() ?? $file->getClientMimeType();

        $allowed = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif',
            'video/mp4', 'video/quicktime',
        ];

        if (! in_array($mimeType, $allowed, true)) {
            return response()->json(['message' => 'Unsupported file type.'], 422);
        }

        $isImage  = str_starts_with($mimeType, 'image/');
        $fileType = $isImage ? 'image' : 'video';
        $userId   = $request->user()->id;

        // Store in storage/app/public/{userId}/
        $path     = $file->store($userId, 'public');
        $publicUrl = Storage::disk('public')->url($path);

        $media = Media::create([
            'id'            => (string) Str::uuid(),
            'user_id'       => $userId,
            'file_name'     => $file->getClientOriginalName(),
            'file_path'     => $path,
            'file_type'     => $fileType,
            'mime_type'     => $mimeType,
            'file_size'     => $file->getSize(),
            'width'         => $request->integer('width') ?: null,
            'height'        => $request->integer('height') ?: null,
            'duration'      => $request->filled('duration') ? (float) $request->input('duration') : null,
            'public_url'    => $publicUrl,
            'thumbnail_url' => $isImage ? $publicUrl : null,
            'created_at'    => now(),
        ]);

        $media->load('uploader:id,display_name,avatar_url,email');

        return response()->json($this->format($media), 201);
    }

    /**
     * Delete own media.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $media = Media::findOrFail($id);

        if ($media->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        Storage::disk('public')->delete($media->file_path);
        $media->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    private function format(Media $m): array
    {
        $uploader = $m->uploader;
        return [
            'id'            => $m->id,
            'user_id'       => $m->user_id,
            'file_name'     => $m->file_name,
            'file_path'     => $m->file_path,
            'file_type'     => $m->file_type,
            'mime_type'     => $m->mime_type,
            'file_size'     => (int) $m->file_size,
            'width'         => $m->width,
            'height'        => $m->height,
            'duration'      => $m->duration,
            'public_url'    => $m->public_url,
            'thumbnail_url' => $m->thumbnail_url,
            'created_at'    => $m->created_at?->toISOString(),
            'uploader'      => $uploader ? [
                'id'           => $uploader->id,
                'display_name' => $uploader->display_name ?? $uploader->name,
                'avatar_url'   => $uploader->avatar_url,
                'email'        => $uploader->email,
            ] : null,
        ];
    }
}
