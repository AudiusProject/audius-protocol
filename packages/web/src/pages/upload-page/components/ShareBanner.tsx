import { useCallback, useContext } from 'react'

import {
  ShareContent,
  UploadType,
  accountSelectors,
  tracksSocialActions,
  usersSocialActions
} from '@audius/common'
import {
  Name,
  ShareSource,
  Collection,
  Track,
  User
} from '@audius/common/models'
import { Button, ButtonType, IconLink, IconTwitterBird } from '@audius/stems'
import { useDispatch } from 'react-redux'

import backgroundPlaceholder from 'assets/img/1-Concert-3-1.jpg'
import { make, useRecord } from 'common/store/analytics/actions'
import {
  ShareMessageConfig,
  getTwitterShareText
} from 'components/share-modal/utils'
import { ToastContext } from 'components/toast/ToastContext'
import { Text } from 'components/typography'
import { copyLinkToClipboard } from 'utils/clipboardUtil'
import { SHARE_TOAST_TIMEOUT_MILLIS } from 'utils/constants'
import { useSelector } from 'utils/reducer'
import { collectionPage } from 'utils/route'
import { openTwitterLink } from 'utils/tweet'

import styles from './ShareBanner.module.css'

const { shareUser } = usersSocialActions
const { shareTrack } = tracksSocialActions

const { getAccountUser } = accountSelectors

const uploadTypeMap = {
  [UploadType.INDIVIDUAL_TRACK]: 'new track',
  [UploadType.INDIVIDUAL_TRACKS]: 'profile',
  [UploadType.PLAYLIST]: 'new playlist',
  [UploadType.ALBUM]: 'new album'
}

const messages = {
  uploadComplete: 'Your Upload is Complete!',
  shareText: (uploadType: UploadType) =>
    `Share your ${uploadTypeMap[uploadType]} with your fans`,
  twitterButtonText: 'Twitter',
  copyLinkButtonText: 'Copy Link',
  copyLinkToast: (uploadType: UploadType) =>
    `Copied Link to your ${uploadTypeMap[uploadType]}`
}

const twitterSharMessages: ShareMessageConfig = {
  profileShareText: () => 'Check out my new tracks on @audius #Audius',
  trackShareText: (title: string) =>
    `Check out my new track ${title} on @audius #Audius`,
  albumShareText: (albumName: string) =>
    `Check out my new album, ${albumName} on @audius #Audius`,
  playlistShareText: (playlistName: string) =>
    `Check out my new playlist, ${playlistName} on @audius #Audius`,
  audioNftPlaylistShareText: () => ''
}

type ShareBannerProps = {
  uploadType: UploadType
  isUnlistedTrack: boolean
}

export const ShareBanner = (props: ShareBannerProps) => {
  const { uploadType, isUnlistedTrack } = props
  const accountUser = useSelector(getAccountUser) as User
  const upload = useSelector((state) => state.upload)
  const dispatch = useDispatch()
  const { toast } = useContext(ToastContext)
  const record = useRecord()

  const handleTwitterShare = useCallback(async () => {
    let twitterShareContent: ShareContent

    switch (uploadType) {
      case UploadType.INDIVIDUAL_TRACK: {
        const track = upload.tracks?.[0]
        if (!track) return

        twitterShareContent = {
          type: 'track',
          track: track.metadata as unknown as Track,
          artist: accountUser
        }
        break
      }

      case UploadType.ALBUM: {
        const album = upload.metadata as Collection
        if (!album) return

        twitterShareContent = {
          type: 'album',
          album,
          artist: accountUser
        }
        break
      }

      case UploadType.PLAYLIST: {
        const playlist = upload.metadata as Collection
        if (!playlist) return

        twitterShareContent = {
          type: 'playlist',
          playlist,
          creator: accountUser
        }
        break
      }

      case UploadType.INDIVIDUAL_TRACKS:
      default: {
        twitterShareContent = {
          type: 'profile',
          profile: accountUser
        }
        break
      }
    }

    const { twitterText, link, analyticsEvent } = await getTwitterShareText(
      twitterShareContent,
      true,
      twitterSharMessages
    )
    openTwitterLink(link, twitterText)
    record(
      make(Name.SHARE_TO_TWITTER, {
        source: ShareSource.UPLOAD,
        ...analyticsEvent
      })
    )
  }, [uploadType, record, upload.tracks, upload.metadata, accountUser])

  const handleCopyLink = useCallback(() => {
    switch (uploadType) {
      case UploadType.INDIVIDUAL_TRACK: {
        const trackId = upload.tracks?.[0].metadata.track_id
        if (!trackId) return
        dispatch(shareTrack(trackId, ShareSource.UPLOAD))
        break
      }
      case UploadType.INDIVIDUAL_TRACKS: {
        dispatch(shareUser(accountUser.user_id, ShareSource.UPLOAD))
        break
      }
      // We don't have access to the playlist_id so we manually copy to clipboard
      case UploadType.ALBUM:
      case UploadType.PLAYLIST: {
        const collectionLink = collectionPage(
          accountUser.handle,
          upload.metadata?.playlist_name,
          upload.completionId,
          null,
          uploadType === UploadType.ALBUM
        )

        copyLinkToClipboard(collectionLink)
        break
      }
    }

    toast(messages.copyLinkToast(uploadType), SHARE_TOAST_TIMEOUT_MILLIS)
  }, [uploadType, toast, upload, dispatch, accountUser])

  return (
    <div
      className={styles.root}
      style={{
        backgroundImage: `linear-gradient(315deg, rgba(91, 35, 225, 0.8) 0%, rgba(162, 47, 237, 0.8) 100%), url(${backgroundPlaceholder})`
      }}
    >
      <Text variant='display' as='h3' size='small' color='darkmodeStaticWhite'>
        {messages.uploadComplete}
      </Text>
      {!isUnlistedTrack ? (
        <>
          <Text variant='heading' size='medium' color='darkmodeStaticWhite'>
            {messages.shareText(uploadType)}
          </Text>
          <div className={styles.buttonContainer}>
            <Button
              fullWidth
              leftIcon={<IconTwitterBird />}
              onClick={handleTwitterShare}
              text={
                <Text variant='title' size='large' color='secondary'>
                  {messages.twitterButtonText}
                </Text>
              }
              type={ButtonType.WHITE}
            />
            <Button
              fullWidth
              leftIcon={<IconLink />}
              onClick={handleCopyLink}
              text={
                <Text variant='title' size='large' color='secondary'>
                  {messages.copyLinkButtonText}
                </Text>
              }
              type={ButtonType.WHITE}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
