<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageUploadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $file = $validated['image'];
        $filename = Str::uuid()->toString() . '.' . $file->getClientOriginalExtension();
        $disk = config('filesystems.media_disk', 'public');
        $path = $file->storeAs('products/uploads', $filename, $disk);

        return response()->json([
            'message' => 'Image televersee avec succes.',
            'data' => [
                'path' => $path,
                'url' => Storage::disk($disk)->url($path),
                'original_name' => $file->getClientOriginalName(),
            ],
        ], 201);
    }
}
