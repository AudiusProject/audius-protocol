import { useCallback } from 'react'

import { Name, ShareSource, User } from '@audius/common/models'
import {
  accountSelectors,
  UploadType,
  shareModalUIActions,
  createChatModalActions
} from '@audius/common/store'
import { Button, IconMessage, IconShare, Text } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import backgroundPlaceholder from 'assets/img/1-Concert-3-1.jpg'
import { make } from 'common/store/analytics/actions'
import { getCopyableLink } from 'utils/clipboardUtil'
import { useSelector } from 'utils/reducer'

import styles from './ShareBanner.module.css'

const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open: openCreateChatModal } = createChatModalActions

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
    `Copied Link to your ${uploadTypeMap[uploadType]}`,
  share: 'Share',
  shareToDirectMessage: 'Direct Message'
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

  const handleShare = useCallback(() => {
    switch (uploadType) {
      case UploadType.INDIVIDUAL_TRACK: {
        const trackId = upload.tracks?.[0].metadata.track_id
        if (!trackId) return
        dispatch(
          requestOpenShareModal({
            type: 'track',
            trackId,
            source: ShareSource.UPLOAD
          })
        )
        break
      }
      case UploadType.INDIVIDUAL_TRACKS: {
        dispatch(
          requestOpenShareModal({
            type: 'profile',
            profileId: accountUser.user_id,
            source: ShareSource.UPLOAD
          })
        )
        break
      }
      case UploadType.ALBUM:
      case UploadType.PLAYLIST: {
        const collectionId = upload.completionId
        if (!collectionId) return
        dispatch(
          requestOpenShareModal({
            type: 'collection',
            collectionId,
            source: ShareSource.UPLOAD
          })
        )
        break
      }
    }
  }, [
    accountUser.user_id,
    dispatch,
    upload.completionId,
    upload.tracks,
    uploadType
  ])

  const handleShareToDirectMessage = useCallback(async () => {
    let permalink: string | undefined
    switch (uploadType) {
      case UploadType.INDIVIDUAL_TRACK:
        permalink = upload.tracks?.[0].metadata.permalink
        break
      case UploadType.INDIVIDUAL_TRACKS:
        permalink = accountUser.handle
        break
      case UploadType.ALBUM:
      case UploadType.PLAYLIST:
        permalink = upload.completedEntity?.permalink
        break
    }

    dispatch(
      openCreateChatModal({
        // Just care about the link
        presetMessage: permalink ? getCopyableLink(permalink) : undefined,
        defaultUserList: 'chats'
      })
    )
    dispatch(make(Name.CHAT_ENTRY_POINT, { source: 'upload' }))
  }, [
    accountUser.handle,
    dispatch,
    upload.completedEntity?.permalink,
    upload.tracks,
    uploadType
  ])

  return (
    <div
      className={styles.root}
      style={{
        backgroundImage: `linear-gradient(315deg, rgba(91, 35, 225, 0.8) 0%, rgba(162, 47, 237, 0.8) 100%), url(${backgroundPlaceholder})`
      }}
    >
      <Text variant='display' tag='h3' size='s' color='inverse'>
        {messages.uploadComplete}
      </Text>
      {!isUnlistedTrack ? (
        <>
          <Text variant='heading' size='m' color='inverse'>
            {messages.shareText(uploadType)}
          </Text>
          <div className={styles.buttonContainer}>
            <>
              <Button
                variant='tertiary'
                fullWidth
                iconLeft={IconMessage}
                onClick={handleShareToDirectMessage}
              >
                {messages.shareToDirectMessage}
              </Button>
              <Button
                variant='tertiary'
                fullWidth
                iconLeft={IconShare}
                onClick={handleShare}
              >
                {messages.share}
              </Button>
            </>
          </div>
        </>
      ) : null}
    </div>
  )
}
