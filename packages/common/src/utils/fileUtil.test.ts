import { describe, it, expect } from 'vitest'

import { StemCategory, Track, User } from '~/models'

import { getFilename } from './fileUtil'

describe('getFilename', () => {
  it('handles basic track with original filename', () => {
    const mockUser: User = {
      name: 'Test User'
    } as User

    const mockTrack: Track = {
      title: 'Test Track',
      orig_filename: 'original_track.wav'
    } as Track

    const result = getFilename({
      track: mockTrack,
      user: mockUser
    })
    expect(result).toBe('original_track.mp3')
  })

  it('uses title when no original filename exists', () => {
    const mockUser: User = {
      name: 'Test User'
    } as User

    const mockTrack: Track = {
      title: 'Test Track',
      orig_filename: ''
    } as Track

    const result = getFilename({
      track: mockTrack,
      user: mockUser
    })
    expect(result).toBe('Test Track.mp3')
  })

  it('includes category when stem_of is present', () => {
    const mockUser: User = {
      name: 'Test User'
    } as User

    const mockTrack: Track = {
      title: 'Test Track',
      orig_filename: 'original_track.wav',
      stem_of: { parent_track_id: 1, category: StemCategory.LEAD_VOCALS }
    } as Track

    const result = getFilename({
      track: mockTrack,
      user: mockUser
    })
    expect(result).toBe('original_track - Lead Vocals.mp3')
  })

  it('handles download format', () => {
    const mockUser: User = {
      name: 'Test User'
    } as User

    const mockTrack: Track = {
      title: 'Test Track',
      orig_filename: 'original_track.wav'
    } as Track

    const result = getFilename({
      track: mockTrack,
      user: mockUser,
      isDownload: true
    })
    expect(result).toBe('original_track - Test User (Audius).mp3')
  })

  it('preserves original extension for original files', () => {
    const mockUser: User = {
      name: 'Test User'
    } as User

    const mockTrack: Track = {
      title: 'Test Track',
      orig_filename: 'original_track.wav'
    } as Track

    const result = getFilename({
      track: mockTrack,
      user: mockUser,
      isOriginal: true
    })
    expect(result).toBe('original_track.wav')
  })

  it('uses original extension for ddex_app files', () => {
    const mockUser: User = {
      name: 'Test User'
    } as User

    const mockTrack: Track = {
      title: 'Test Track',
      orig_filename: 'original_track.flac',
      ddex_app: '0x123'
    } as Track

    const result = getFilename({
      track: mockTrack,
      user: mockUser
    })
    expect(result).toBe('Test Track.flac')
  })

  it('uses original extension for ddex_app files with download format', () => {
    const mockUser: User = {
      name: 'Test User'
    } as User

    const mockTrack: Track = {
      title: 'Test Track',
      orig_filename: 'original_track.flac',
      ddex_app: '0x123'
    } as Track

    const result = getFilename({
      track: mockTrack,
      user: mockUser,
      isDownload: true
    })
    expect(result).toBe('Test Track - Test User (Audius).flac')
  })
})
