import { Track } from '@audius/common/models'
import {} from '@audius/common'

// return the original string if it exists, or ''
export const emptyStringGuard = (str: string | null | undefined) => str ?? ''

export const defaultFieldVisibility = {
  genre: true,
  mood: true,
  tags: true,
  share: true,
  play_count: true,
  remixes: true
}

export const getTrackDefaults = (heroTrack: Track | null) => ({
  title: emptyStringGuard(heroTrack?.title),
  trackId: heroTrack?.track_id ?? 0,
  coverArtSizes: heroTrack?._cover_art_sizes ?? null,
  tags: emptyStringGuard(heroTrack?.tags),
  description: emptyStringGuard(heroTrack?.description),
  playCount: heroTrack?.play_count ?? 0,
  duration: heroTrack?.duration ?? 0,
  released: emptyStringGuard(heroTrack?.release_date || heroTrack?.created_at),
  credits: emptyStringGuard(heroTrack?.credits_splits),
  genre: emptyStringGuard(heroTrack?.genre),
  mood: emptyStringGuard(heroTrack?.mood),
  repostCount: heroTrack?.repost_count ?? 0,
  saveCount: heroTrack?.save_count ?? 0,
  isUnlisted: heroTrack?.is_unlisted ?? false,
  isScheduledRelease: heroTrack?.is_scheduled_release ?? false,
  isStreamGated: heroTrack?.is_stream_gated ?? false,
  streamConditions: heroTrack?.stream_conditions ?? null,
  isDownloadGated: heroTrack?.is_download_gated ?? false,
  downloadConditions: heroTrack?.download_conditions ?? null,
  isPublishing: heroTrack?._is_publishing ?? false,
  aiAttributionUserId: heroTrack?.ai_attribution_user_id ?? null,
  fieldVisibility: {
    ...defaultFieldVisibility,
    ...(heroTrack?.field_visibility ?? {})
  },
  coSign: heroTrack?._co_sign ?? null,
  remixTrackIds: heroTrack?._remixes?.map(({ track_id }) => track_id) ?? null,
  remixesCount: heroTrack?._remixes_count ?? null,
  remixParentTrackId: heroTrack?.remix_of?.tracks?.[0]?.parent_track_id,
  download: heroTrack?.download ?? null
})
