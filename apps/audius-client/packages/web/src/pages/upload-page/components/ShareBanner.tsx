import { useCallback } from 'react'

import { Name, User, FeatureFlags } from '@audius/common'
import { Button, ButtonType, IconTikTok, IconTwitterBird } from '@audius/stems'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import backgroundPlaceholder from 'assets/img/1-Concert-3-1.jpg'
import { ReactComponent as IconShare } from 'assets/img/iconShare.svg'
import { useModalState } from 'common/hooks/useModalState'
import { open as openTikTokModal } from 'common/store/ui/share-sound-to-tiktok-modal/slice'
import Toast from 'components/toast/Toast'
import { MountPlacement, ComponentPlacement } from 'components/types'
import { useFlag } from 'hooks/useRemoteConfig'
import AudiusBackend from 'services/AudiusBackend'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { useRecord, make } from 'store/analytics/actions'
import { copyLinkToClipboard } from 'utils/clipboardUtil'
import {
  fullAlbumPage,
  fullPlaylistPage,
  fullProfilePage,
  fullTrackPage,
  profilePage,
  albumPage,
  playlistPage
} from 'utils/route'
import { openTwitterLink } from 'utils/tweet'

import { UploadPageState } from '../store/types'

import styles from './ShareBanner.module.css'

type UploadType = 'Track' | 'Tracks' | 'Album' | 'Playlist' | 'Remix'
type ContinuePage = 'Track' | 'Profile' | 'Album' | 'Playlist' | 'Remix'

type ShareBannerProps = {
  isHidden: boolean
  type: UploadType
  upload: UploadPageState
  user: User
}

const messages = {
  title: (type: UploadType) =>
    `Your ${type} ${type === 'Tracks' ? 'Are' : 'Is'} Live!`,
  description: 'Now it’s time to spread the word and share it with your fans!',
  share: 'Share With Your Fans',
  shareToTikTok: 'Share Sound to TikTok',
  copy: (page: ContinuePage) => `Copy Link to ${page}`,
  copiedToClipboard: 'Copied to Clipboard'
}

const getContinuePage = (uploadType: UploadType) => {
  if (uploadType === 'Tracks') return 'Profile'
  return uploadType
}

const getTwitterHandleByUserHandle = async (userHandle: string) => {
  const { twitterHandle } = await AudiusBackend.getCreatorSocialHandle(
    userHandle
  )
  return twitterHandle || ''
}

const getShareTextUrl = async (
  uploadType: UploadType,
  user: User,
  upload: UploadPageState,
  fullUrl = true
) => {
  switch (uploadType) {
    case 'Track': {
      const { title, permalink } = upload.tracks[0].metadata
      const url = fullUrl ? fullTrackPage(permalink) : permalink
      return {
        text: `Check out my new track, ${title} on @AudiusProject #Audius`,
        url
      }
    }
    case 'Remix': {
      const { permalink } = upload.tracks[0].metadata
      const parent_track_id =
        upload.tracks[0].metadata?.remix_of?.tracks[0].parent_track_id
      if (!parent_track_id) return { text: '', url: '' }

      const url = fullUrl ? fullTrackPage(permalink) : permalink
      const parentTrack = await apiClient.getTrack({ id: parent_track_id })
      if (!parentTrack) return { text: '', url: '' }

      const parentTrackUser = parentTrack.user

      let twitterHandle = await getTwitterHandleByUserHandle(
        parentTrackUser.handle
      )
      if (!twitterHandle) twitterHandle = parentTrackUser.name
      else twitterHandle = `@${twitterHandle}`

      return {
        text: `Check out my new remix of ${parentTrack.title} by ${twitterHandle} on @AudiusProject #Audius`,
        url
      }
    }
    case 'Tracks': {
      const getPage = fullUrl ? fullProfilePage : profilePage
      const url = getPage(user.handle)
      return { text: `Check out my new tracks on @AudiusProject #Audius`, url }
    }
    case 'Album': {
      // @ts-ignore
      const { playlist_name: title } = upload.metadata
      const getPage = fullUrl ? fullAlbumPage : albumPage
      const url = getPage(user.handle, title, upload.completionId)
      return {
        text: `Check out my new album, ${title} on @AudiusProject #Audius`,
        url
      }
    }
    case 'Playlist': {
      // @ts-ignore
      const { playlist_name: title } = upload.metadata
      const getPage = fullUrl ? fullPlaylistPage : playlistPage
      const url = getPage(user.handle, title, upload.completionId)
      return {
        text: `Check out my new playlist, ${title} on @AudiusProject #Audius`,
        url
      }
    }
  }
}
// The toast appears for copy link
const TOAST_DELAY = 3000

const ShareBanner = ({ isHidden, type, upload, user }: ShareBannerProps) => {
  const dispatch = useDispatch()
  const record = useRecord()
  const [, setIsTikTokModalOpen] = useModalState('ShareSoundToTikTok')
  const { isEnabled: isShareSoundToTikTokEnabled } = useFlag(
    FeatureFlags.SHARE_SOUND_TO_TIKTOK
  )

  const onClickTwitter = useCallback(async () => {
    const { url, text } = await getShareTextUrl(type, user, upload)
    openTwitterLink(url, text)
    record(
      make(Name.TRACK_UPLOAD_SHARE_WITH_FANS, {
        uploadType: type,
        text
      })
    )
  }, [type, user, upload, record])

  const onClickTikTok = useCallback(async () => {
    // Sharing to TikTok is currently only enabled for single track uploads
    const track = upload.tracks[0]
    if (track.metadata) {
      dispatch(
        openTikTokModal({
          track: {
            id: track.metadata.track_id,
            title: track.metadata.title,
            duration: track.metadata.duration
          }
        })
      )
      setIsTikTokModalOpen(true)
    }
    record(make(Name.TRACK_UPLOAD_SHARE_SOUND_TO_TIKTOK, {}))
  }, [upload, record, dispatch, setIsTikTokModalOpen])

  const onCopy = useCallback(async () => {
    const { url } = await getShareTextUrl(type, user, upload, false)
    copyLinkToClipboard(url)
    record(
      make(Name.TRACK_UPLOAD_COPY_LINK, {
        uploadType: type,
        url
      })
    )
  }, [type, user, upload, record])

  const shouldShowShareToTikTok = () => {
    return (
      type === 'Track' &&
      isShareSoundToTikTokEnabled &&
      !upload.tracks[0]?.metadata.is_unlisted
    )
  }

  const continuePage = getContinuePage(type)

  return (
    <div
      className={cn(styles.container, { [styles.fullHeight]: !isHidden })}
      style={{
        backgroundImage: `linear-gradient(315deg, rgba(91, 35, 225, 0.8) 0%, rgba(162, 47, 237, 0.8) 100%), url(${backgroundPlaceholder})`
      }}
    >
      <div className={styles.title}>{messages.title(type)}</div>
      <div className={styles.description}>{messages.description}</div>
      <div className={styles.buttonContainer}>
        <Button
          onClick={onClickTwitter}
          className={cn(styles.button, styles.buttonTwitter)}
          textClassName={styles.buttonText}
          type={ButtonType.WHITE}
          text={messages.share}
          leftIcon={<IconTwitterBird />}
        />
        {shouldShowShareToTikTok() && (
          <Button
            onClick={onClickTikTok}
            className={cn(styles.button, styles.buttonTikTok)}
            textClassName={styles.buttonText}
            type={ButtonType.WHITE}
            text={
              <div className={styles.buttonTextTikTok}>
                <IconTikTok />
                <span>{messages.shareToTikTok}</span>
              </div>
            }
          />
        )}
      </div>
      <div className={styles.copyLinkWrapper} onClick={onCopy}>
        <Toast
          useCaret={false}
          mount={MountPlacement.BODY}
          placement={ComponentPlacement.TOP}
          overlayClassName={styles.toast}
          delay={TOAST_DELAY}
          text={messages.copiedToClipboard}
        >
          <div className={styles.copyLinkContainer}>
            <IconShare className={styles.shareIcon} />
            <div className={styles.copyText}>{messages.copy(continuePage)}</div>
          </div>
        </Toast>
      </div>
    </div>
  )
}

export default ShareBanner
