import React, { useCallback } from 'react'
import { Button, ButtonType, IconTwitterBird } from '@audius/stems'

import cn from 'classnames'
import styles from './ShareBanner.module.css'
import backgroundPlaceholder from 'assets/img/1-Concert-3-1.jpg'
import { ReactComponent as IconShare } from 'assets/img/iconShare.svg'
import AudiusBackend from 'services/AudiusBackend'
import { copyLinkToClipboard } from 'utils/clipboardUtil'
import User from 'models/User'
import Toast from 'components/toast/Toast'
import { MountPlacement, ComponentPlacement } from 'components/types'
import { useRecord, make } from 'store/analytics/actions'
import { Name } from 'services/analytics'
import { UploadPageState } from '../store/types'
import apiClient from 'services/audius-api-client/AudiusAPIClient'

import {
  fullTrackPage,
  fullAlbumPage,
  fullPlaylistPage,
  fullProfilePage,
  trackPage,
  profilePage,
  albumPage,
  playlistPage
} from 'utils/route'
import { openTwitterLink } from 'utils/tweet'

type UploadType = 'Track' | 'Tracks' | 'Album' | 'Playlist' | 'Remix'
type ContinuePage = 'Track' | 'Profile' | 'Album' | 'Playlist' | 'Remix'

type ShareBannerProps = {
  type: UploadType
  isHidden: boolean
  upload: UploadPageState
  user: User
}

const messages = {
  title: (type: UploadType) =>
    `Your ${type} ${type === 'Tracks' ? 'Are' : 'Is'} Live!`,
  description: 'Now it’s time to spread the word and share it with your fans!',
  share: 'Share With Your Fans',
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
      const { title } = upload.tracks[0].metadata
      const getPage = fullUrl ? fullTrackPage : trackPage
      const url = getPage(user.handle, title, upload.completionId)
      return {
        text: `Check out my new track, ${title} on @AudiusProject #Audius`,
        url
      }
    }
    case 'Remix': {
      const title = upload.tracks[0].metadata.title
      const parent_track_id =
        upload.tracks[0].metadata?.remix_of?.tracks[0].parent_track_id
      if (!parent_track_id) return { text: '', url: '' }

      const getPage = fullUrl ? fullTrackPage : trackPage
      const url = getPage(user.handle, title, upload.completionId)
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

const ShareBanner = ({ type, user, isHidden, upload }: ShareBannerProps) => {
  const record = useRecord()

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
      <Button
        onClick={onClickTwitter}
        className={styles.button}
        textClassName={styles.buttonText}
        type={ButtonType.WHITE}
        text={messages.share}
        leftIcon={<IconTwitterBird />}
      />
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
