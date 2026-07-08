<?php

namespace App\Http\Controllers;

use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;

class MediaController extends Controller
{
    private const PAGE_SIZE = 20;

    /** MIME types that browsers cannot render natively and must be converted. */
    private const HEIC_TYPES = ['image/heic', 'image/heif'];

    /** Target width (px) for WebP thumbnails. Height scales proportionally. */
    private const THUMB_WIDTH = 800;

    // ── Lazy-initialised Intervention ImageManager ────────────────────────────

    private ?ImageManager $imageManager = null;

    private function imageManager(): ImageManager
    {
        if ($this->imageManager === null) {
            $this->imageManager = new ImageManager(new GdDriver());
        }
        return $this->imageManager;
    }

    // ── Public endpoints ──────────────────────────────────────────────────────

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
     *
     * For HEIC/HEIF images, Intervention Image converts the file to WebP so
     * browsers can render it without any plug-in. The original HEIC is also
     * kept (for lossless downloads) and its path recorded in `file_path`.
     * The converted WebP is the `public_url` / `thumbnail_url` pair shown in
     * the gallery. `webp_path` lets us clean up both files on delete.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file'     => ['required', 'file', 'max:512000'], // 500 MB in KB
            'width'    => ['nullable', 'integer'],
            'height'   => ['nullable', 'integer'],
            'duration' => ['nullable', 'numeric'],
            'location' => ['nullable', 'string', 'max:255'],
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
        $isHeic   = in_array($mimeType, self::HEIC_TYPES, true);
        $fileType = $isImage ? 'image' : 'video';
        $userId   = $request->user()->id;

        // ── 1. Store the original file ────────────────────────────────────────
        $originalPath = $file->store($userId, 'public');
        $publicUrl    = Storage::disk('public')->url($originalPath);

        // ── 2. For HEIC: convert to WebP with Intervention Image ─────────────
        $webpPath     = null;
        $thumbUrl     = $isImage ? $publicUrl : null;
        $webpUrl      = null;

        if ($isImage && $isHeic) {
            try {
                $image = $this->imageManager()->read($file->getRealPath());

                // Derive dimensions before scaling (for DB storage)
                $origWidth  = $image->width();
                $origHeight = $image->height();

                // Scale down to thumbnail width, preserving aspect ratio
                if ($origWidth > self::THUMB_WIDTH) {
                    $image->scale(width: self::THUMB_WIDTH);
                }

                // Encode as WebP (quality 85 — good balance of size vs quality)
                $webpBasename = pathinfo($originalPath, PATHINFO_FILENAME) . '.webp';
                $webpRelative = $userId . '/thumbs/' . $webpBasename;
                $webpAbsolute = storage_path('app/public/' . $webpRelative);

                // Ensure the thumbs directory exists
                $thumbsDir = dirname($webpAbsolute);
                if (! is_dir($thumbsDir)) {
                    mkdir($thumbsDir, 0755, true);
                }

                $image->toWebp(quality: 85)->save($webpAbsolute);

                $webpPath = $webpRelative;
                $webpUrl  = Storage::disk('public')->url($webpRelative);
                $thumbUrl = $webpUrl; // gallery / viewer shows the WebP

                // Use actual dimensions from the original HEIC
                if (! $request->filled('width')) {
                    $request->merge(['width' => $origWidth, 'height' => $origHeight]);
                }
            } catch (\Throwable $e) {
                // Conversion failed — fall back to the HEIC itself.
                // The front-end HEIC fallback UI will handle it gracefully.
                \Illuminate\Support\Facades\Log::warning('HEIC→WebP conversion failed', [
                    'file' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // ── 3. Persist the record ─────────────────────────────────────────────
        $media = Media::create([
            'id'            => (string) Str::uuid(),
            'user_id'       => $userId,
            'file_name'     => $file->getClientOriginalName(),
            'file_path'     => $originalPath,
            'file_type'     => $fileType,
            'mime_type'     => $isHeic && $webpPath ? 'image/webp' : $mimeType,
            'file_size'     => $file->getSize(),
            'width'         => $request->integer('width') ?: null,
            'height'        => $request->integer('height') ?: null,
            'duration'      => $request->filled('duration') ? (float) $request->input('duration') : null,
            'public_url'    => $webpUrl ?? $publicUrl,   // viewers always get a browser-safe URL
            'thumbnail_url' => $thumbUrl,
            'webp_path'     => $webpPath,
            'location'      => $request->input('location') ?: null,
            'created_at'    => now(),
        ]);

        $media->load('uploader:id,display_name,avatar_url,email');

        return response()->json($this->format($media), 201);
    }

    /**
     * Delete own media — removes both the original and the WebP thumbnail.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $media = Media::findOrFail($id);

        if ($media->user_id != $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        Storage::disk('public')->delete($media->file_path);

        if ($media->webp_path) {
            Storage::disk('public')->delete($media->webp_path);
        }

        $media->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function format(Media $m): array
    {
        $uploader = $m->uploader;
        return [
            'id'            => $m->id,
            'user_id'       => (string) $m->user_id,
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
            'location'      => $m->location,
            'created_at'    => $m->created_at?->toISOString(),
            'uploader'      => $uploader ? [
                'id'           => (string) $uploader->id,
                'display_name' => $uploader->display_name ?? $uploader->name,
                'avatar_url'   => $uploader->avatar_url,
                'email'        => $uploader->email,
            ] : null,
        ];
    }
}
