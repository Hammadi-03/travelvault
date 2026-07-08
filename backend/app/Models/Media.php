<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Media extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'file_name',
        'file_path',
        'file_type',
        'mime_type',
        'file_size',
        'width',
        'height',
        'duration',
        'public_url',
        'thumbnail_url',
        'webp_path',
        'location',
        'created_at',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'width'     => 'integer',
        'height'    => 'integer',
        'duration'  => 'float',
        'created_at'=> 'datetime',
    ];

    public function uploader()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
