/**
 * utils.ts — unit tests
 */

import { describe, it, expect } from 'vitest'
import {
  cn,
  formatBytes,
  formatDuration,
  getInitials,
  generateId,
  isImageFile,
  isVideoFile,
  ACCEPTED_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    // twMerge: p-2 overrides p-4
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('handles undefined/null gracefully', () => {
    expect(cn('base', undefined, null as unknown as string)).toBe('base')
  })
})

describe('formatBytes', () => {
  it('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
  })

  it('formats gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB')
  })

  it('respects decimal precision', () => {
    expect(formatBytes(1536, 1)).toBe('1.5 KB')
  })
})

describe('formatDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('formats seconds below one minute', () => {
    expect(formatDuration(45)).toBe('0:45')
  })

  it('formats exactly one minute', () => {
    expect(formatDuration(60)).toBe('1:00')
  })

  it('pads single-digit seconds', () => {
    expect(formatDuration(65)).toBe('1:05')
  })

  it('formats longer durations', () => {
    expect(formatDuration(3661)).toBe('61:01')
  })
})

describe('getInitials', () => {
  it('returns initials for a full name', () => {
    expect(getInitials('Alice Bob')).toBe('AB')
  })

  it('returns single initial for a single name', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('uppercases the result', () => {
    expect(getInitials('alice bob')).toBe('AB')
  })

  it('caps at 2 characters', () => {
    expect(getInitials('Alice Bob Carol')).toBe('AB')
  })
})

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string')
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId))
    expect(ids.size).toBe(100)
  })
})

describe('isImageFile', () => {
  it('returns true for accepted image MIME types', () => {
    expect(isImageFile('image/jpeg')).toBe(true)
    expect(isImageFile('image/png')).toBe(true)
    expect(isImageFile('image/heic')).toBe(true)
    expect(isImageFile('image/heif')).toBe(true)
  })

  it('returns false for video types', () => {
    expect(isImageFile('video/mp4')).toBe(false)
  })

  it('returns false for unknown types', () => {
    expect(isImageFile('application/pdf')).toBe(false)
  })
})

describe('isVideoFile', () => {
  it('returns true for accepted video MIME types', () => {
    expect(isVideoFile('video/mp4')).toBe(true)
    expect(isVideoFile('video/quicktime')).toBe(true)
  })

  it('returns false for image types', () => {
    expect(isVideoFile('image/jpeg')).toBe(false)
  })
})

describe('ACCEPTED_TYPES', () => {
  it('includes all image and video types', () => {
    expect(ACCEPTED_TYPES).toContain('image/jpeg')
    expect(ACCEPTED_TYPES).toContain('video/mp4')
  })
})

describe('MAX_FILE_SIZE', () => {
  it('is 500 MB', () => {
    expect(MAX_FILE_SIZE).toBe(500 * 1024 * 1024)
  })
})
