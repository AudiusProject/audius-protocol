import { describe, it, expect, vi, beforeEach } from 'vitest'

import { render, screen } from 'test/test-utils'

import { CollectionFormState } from '../types'

import { UploadCollectionForm } from './UploadCollectionForm'

import { authedUserStore } from 'test/redux-state'

const baseMockedFormState: CollectionFormState = {
  tracks: [
    {
      file: 'blob' as unknown as File, // No reason to use a real blob in this test
      preview: { addEventListener: vi.fn() },
      metadata: {
        track_cid: null,
        owner_id: null,
        title: 'a-little-gambling copy 3',
        duration: 10,
        length: null,
        cover_art: null,
        cover_art_sizes: null,
        tags: null,
        genre: null,
        mood: null,
        credits_splits: null,
        created_at: null,
        create_date: null,
        updated_at: null,
        release_date: null,
        file_type: null,
        track_segments: [],
        has_current_user_reposted: false,
        followee_reposts: [],
        followee_saves: [],
        is_current: true,
        is_scheduled_release: false,
        is_unlisted: false,
        is_stream_gated: false,
        stream_conditions: null,
        is_download_gated: false,
        download_conditions: null,
        is_original_available: false,
        is_downloadable: false,
        preview_start_seconds: null,
        audio_upload_id: null,
        field_visibility: {
          genre: true,
          mood: true,
          tags: true,
          share: false,
          play_count: false,
          remixes: true
        },
        remix_of: null,
        repost_count: 0,
        save_count: 0,
        description: null,
        license: null,
        isrc: null,
        iswc: null,
        download: null,
        is_playlist_upload: false,
        ai_attribution_user_id: null,
        ddex_release_ids: null,
        ddex_app: null,
        artists: null,
        resource_contributors: null,
        indirect_resource_contributors: null,
        rights_controller: null,
        copyright_line: null,
        producer_copyright_line: null,
        parental_warning_type: null,
        artwork: { file: null, url: '' },
        orig_filename: 'a-little-gambling copy 3.mp3'
      }
    }
  ],
  uploadType: 3,
  metadata: {
    is_album: false,
    is_current: true,
    is_private: true,
    tags: null,
    genre: null,
    mood: null,
    created_at: null,
    updated_at: null,
    cover_art: null,
    cover_art_sizes: null,
    playlist_name: '',
    playlist_owner_id: null,
    save_count: null,
    license: null,
    upc: null,
    description: null,
    ddex_release_ids: null,
    ddex_app: null,
    artists: null,
    copyright_line: null,
    producer_copyright_line: null,
    parental_warning_type: null
  }
}

describe('UploadCollectionForm', () => {
  it('should render', () => {
    const onContinue = vi.fn()

    render(
      <UploadCollectionForm
        formState={baseMockedFormState}
        onContinue={onContinue}
      />,
      {
        reduxState: authedUserStore
      }
    )
    expect(screen.getByText(/album name/i)).toBeInTheDocument()
  })
})
