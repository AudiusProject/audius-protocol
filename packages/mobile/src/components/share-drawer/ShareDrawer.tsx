import React, { useCallback, useRef } from 'react'

import {
  accountSelectors,
  collectionsSocialActions,
  FeatureFlags,
  Name,
  shareModalUISelectors,
  shareSoundToTiktokModalActions,
  ShareSource,
  tracksSocialActions,
  usersSocialActions
} from '@audius/common'
import Clipboard from '@react-native-clipboard/clipboard'
import { Linking } from 'react-native'
import ViewShot from 'react-native-view-shot'
import { useDispatch, useSelector } from 'react-redux'

import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconLink from 'app/assets/images/iconLink.svg'
import IconMessage from 'app/assets/images/iconMessage.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import IconSnapchat from 'app/assets/images/iconSnapchat.svg'
import TikTokIcon from 'app/assets/images/iconTikTokInverted.svg'
import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { useToast } from 'app/hooks/useToast'
import type { AppTabScreenParamList } from 'app/screens/app-screen'
import { make, track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import ActionDrawer from '../action-drawer'
import { Text } from '../core'
import { useDrawerState } from '../drawer/AppDrawer'

import { ShareToStorySticker } from './ShareToStorySticker'
import { messages } from './messages'
import { useShareToStory } from './useShareToStory'
import { getContentUrl, getTwitterShareUrl } from './utils'

const { getShareContent, getShareSource } = shareModalUISelectors
const { requestOpen: requestOpenTikTokModal } = shareSoundToTiktokModalActions
const { shareUser } = usersSocialActions
const { shareTrack } = tracksSocialActions
const { shareCollection } = collectionsSocialActions
const { getAccountUser } = accountSelectors

export const shareToastTimeout = 1500

const useStyles = makeStyles(({ spacing }) => ({
  titleHelperText: {
    paddingHorizontal: spacing(4),
    marginBottom: spacing(4),
    textAlign: 'center'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(6)
  },
  viewShot: {
    position: 'absolute',
    // Position the container off-screen (264px is the width of the whole thing)
    right: -264 - 5
  }
}))

export const ShareDrawer = () => {
  const styles = useStyles()
  const viewShotRef = useRef() as React.RefObject<ViewShot>
  const navigation = useNavigation<AppTabScreenParamList>()

  const { isEnabled: isShareSoundToTikTokEnabled } = useFeatureFlag(
    FeatureFlags.SHARE_SOUND_TO_TIKTOK
  )
  const { onClose } = useDrawerState('Share')
  const { onClose: onCloseNowPlaying } = useDrawer('NowPlaying')

  const { secondary } = useThemeColors()
  const dispatch = useDispatch()
  const content = useSelector(getShareContent)
  const source = useSelector(getShareSource)
  const account = useSelector(getAccountUser)
  const { toast } = useToast()
  const isOwner =
    content?.type === 'track' &&
    account &&
    account.user_id === content.artist.user_id
  const shareType = content?.type ?? 'track'

  const isStreamGatedTrack =
    content?.type === 'track' && content.track.is_stream_gated

  const handleShareToDirectMessage = useCallback(async () => {
    if (!content) return
    navigation.navigate('ChatUserList', {
      presetMessage: getContentUrl(content),
      defaultUserList: 'chats'
    })
    track(make({ eventName: Name.CHAT_ENTRY_POINT, source: 'share' }))
    if (source === ShareSource.NOW_PLAYING) {
      onCloseNowPlaying()
    }
  }, [content, navigation, source, onCloseNowPlaying])

  const handleShareToTwitter = useCallback(async () => {
    if (!content) return
    const twitterShareUrl = await getTwitterShareUrl(content)
    const isSupported = await Linking.canOpenURL(twitterShareUrl)
    if (isSupported) {
      Linking.openURL(twitterShareUrl)
    } else {
      console.error(`Can't open: ${twitterShareUrl}`)
    }
  }, [content])

  const handleShareSoundToTikTok = useCallback(() => {
    if (content?.type === 'track') {
      dispatch(requestOpenTikTokModal({ id: content.track.track_id }))
    }
  }, [content, dispatch])

  const {
    handleShareToStoryStickerLoad,
    handleShareToInstagramStory,
    handleShareToSnapchat,
    handleShareToTikTok: handleShareVideoToTiktok,
    selectedPlatform
  } = useShareToStory({ content, viewShotRef })

  const handleCopyLink = useCallback(() => {
    if (!content) return
    const link = getContentUrl(content)
    Clipboard.setString(link)
    toast({
      content: messages.toast(shareType),
      type: 'info',
      timeout: shareToastTimeout
    })
  }, [toast, content, shareType])

  const handleOpenShareSheet = useCallback(() => {
    if (!source || !content) return
    switch (content.type) {
      case 'track':
        dispatch(shareTrack(content.track.track_id, source))
        break
      case 'profile':
        dispatch(shareUser(content.profile.user_id, source))
        break
      case 'album':
        dispatch(shareCollection(content.album.playlist_id, source))
        break
      case 'playlist':
        dispatch(shareCollection(content.playlist.playlist_id, source))
        break
    }
  }, [dispatch, content, source])

  const isShareableTrack =
    content?.type === 'track' &&
    !content.track.is_unlisted &&
    !content.track.is_invalid &&
    !content.track.is_delete &&
    !isStreamGatedTrack

  const shouldIncludeTikTokSoundAction = Boolean(
    isShareSoundToTikTokEnabled && isOwner && isShareableTrack
  )

  const performActionAndClose = useCallback(
    (action: () => void) => {
      return () => {
        action()
        onClose()
      }
    },
    [onClose]
  )

  const getRows = useCallback(() => {
    const shareToChatAction = {
      icon: <IconMessage fill={secondary} height={26} width={26} />,
      text: messages.directMessage,
      callback: performActionAndClose(handleShareToDirectMessage)
    }

    const shareToTwitterAction = {
      icon: <IconTwitterBird fill={secondary} height={20} width={26} />,
      text: messages.twitter,
      callback: performActionAndClose(handleShareToTwitter)
    }

    const shareSoundToTiktokAction = {
      text: messages.tikTokSound,
      icon: <TikTokIcon height={26} width={26} />,
      callback: performActionAndClose(handleShareSoundToTikTok)
    }

    const shareVideoToTiktokAction = {
      text: messages.tikTokVideo,
      icon: <TikTokIcon fill={secondary} height={26} width={26} />,
      callback: handleShareVideoToTiktok
    }

    const copyLinkAction = {
      text: messages.copyLink,
      icon: <IconLink height={26} width={26} fill={secondary} />,
      callback: performActionAndClose(handleCopyLink)
    }

    const shareSheetAction = {
      text: messages.shareSheet,
      icon: <IconShare height={26} width={26} fill={secondary} />,
      callback: performActionAndClose(handleOpenShareSheet)
    }

    const shareToSnapchatAction = {
      text: messages.snapchat,
      icon: <IconSnapchat fill={secondary} height={26} width={26} />,
      callback: handleShareToSnapchat
    }

    const shareToInstagramStoriesAction = {
      text: messages.instagramStory,
      icon: <IconInstagram fill={secondary} height={26} width={26} />,
      callback: handleShareToInstagramStory
    }

    const result: {
      text: string
      icon: React.ReactElement
      style?: Record<string, string>
      callback: (() => void) | (() => Promise<void>)
    }[] = [shareToChatAction, shareToTwitterAction]

    if (shouldIncludeTikTokSoundAction) {
      result.push(shareSoundToTiktokAction)
    }

    if (isShareableTrack) {
      result.push(shareToInstagramStoriesAction)
      result.push(shareVideoToTiktokAction)
      result.push(shareToSnapchatAction)
    }

    result.push(copyLinkAction, shareSheetAction)

    return result
  }, [
    secondary,
    performActionAndClose,
    handleShareToDirectMessage,
    handleShareToTwitter,
    handleShareSoundToTikTok,
    handleShareVideoToTiktok,
    handleCopyLink,
    handleOpenShareSheet,
    handleShareToSnapchat,
    handleShareToInstagramStory,
    shouldIncludeTikTokSoundAction,
    isShareableTrack
  ])

  return (
    <>
      {/* Redundant `content?.type === 'track'` needed to make TS happy */}
      {content?.type === 'track' ? (
        <ViewShot
          style={styles.viewShot}
          ref={viewShotRef}
          options={{ format: 'png' }}
        >
          <ShareToStorySticker
            onLoad={handleShareToStoryStickerLoad}
            track={content?.track}
            artist={content?.artist}
            omitLogo={selectedPlatform === 'tiktok'}
          />
        </ViewShot>
      ) : null}
      <ActionDrawer
        disableAutoClose={true}
        modalName='Share'
        rows={getRows()}
        title={messages.modalTitle(shareType)}
        titleIcon={IconShare}
        styles={{ row: styles.row }}
      >
        {content?.type === 'playlist' &&
        content.playlist.is_private &&
        isOwner ? (
          <Text style={styles.titleHelperText} fontSize='large'>
            {messages.hiddenPlaylistShareHelperText}
          </Text>
        ) : null}
      </ActionDrawer>
    </>
  )
}
