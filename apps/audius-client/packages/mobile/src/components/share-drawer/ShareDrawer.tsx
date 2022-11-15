import React, { useCallback, useContext } from 'react'

import path from 'path'

import {
  encodeHashId,
  FeatureFlags,
  accountSelectors,
  collectionsSocialActions,
  tracksSocialActions,
  usersSocialActions,
  shareModalUISelectors,
  shareSoundToTiktokModalActions,
  uuid
} from '@audius/common'
import Clipboard from '@react-native-clipboard/clipboard'
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native'
import { Linking, View } from 'react-native'
import Config from 'react-native-config'
import RNFS from 'react-native-fs'
import Share from 'react-native-share'
import { useDispatch, useSelector } from 'react-redux'

import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconLink from 'app/assets/images/iconLink.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import IconTikTok from 'app/assets/images/iconTikTok.svg'
import IconTikTokInverted from 'app/assets/images/iconTikTokInverted.svg'
import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import Text from 'app/components/text'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { apiClient } from 'app/services/audius-api-client'
import { makeStyles } from 'app/styles'
import { Theme, useThemeColors, useThemeVariant } from 'app/utils/theme'

import ActionDrawer from '../action-drawer'
import { ToastContext } from '../toast/ToastContext'

import { messages } from './messages'
import { getContentUrl, getTwitterShareUrl } from './utils'
const { getShareState } = shareModalUISelectors
const { requestOpen: requestOpenTikTokModal } = shareSoundToTiktokModalActions
const { shareUser } = usersSocialActions
const { shareTrack } = tracksSocialActions
const { shareCollection } = collectionsSocialActions
const { getAccountUser } = accountSelectors

const useStyles = makeStyles(({ palette }) => ({
  shareToTwitterAction: {
    color: palette.staticTwitterBlue
  },
  shareToTikTokAction: {
    color: 'black'
  },
  shareToTikTokActionDark: {
    color: palette.staticWhite
  },
  copyLinkAction: {
    color: palette.secondary
  },
  shareToInstagramStoryAction: {
    color: palette.primary
  },
  title: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16
  },
  titleText: {
    fontSize: 18
  },
  titleIcon: {
    marginRight: 8
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24
  }
}))

export const ShareDrawer = () => {
  const styles = useStyles()
  const { isEnabled: isShareToTikTokEnabled } = useFeatureFlag(
    FeatureFlags.SHARE_SOUND_TO_TIKTOK
  )
  const { isEnabled: isShareToInstagramStoryEnabled } = useFeatureFlag(
    FeatureFlags.SHARE_TO_STORY
  )
  const { primary, secondary, neutral, staticTwitterBlue } = useThemeColors()
  const themeVariant = useThemeVariant()
  const isLightMode = themeVariant === Theme.DEFAULT
  const dispatch = useDispatch()
  const { content, source } = useSelector(getShareState)
  const account = useSelector(getAccountUser)
  const { toast } = useContext(ToastContext)
  const isOwner =
    content?.type === 'track' &&
    account &&
    account.user_id === content.artist.user_id
  const shareType = content?.type ?? 'track'

  const handleShareToTwitter = useCallback(async () => {
    if (!content) return
    const twitterShareUrl = getTwitterShareUrl(content)
    const isSupported = await Linking.canOpenURL(twitterShareUrl)
    if (isSupported) {
      Linking.openURL(twitterShareUrl)
    } else {
      console.error(`Can't open: ${twitterShareUrl}`)
    }
  }, [content])

  const handleShareToTikTok = useCallback(() => {
    if (content?.type === 'track') {
      dispatch(requestOpenTikTokModal({ id: content.track.track_id }))
    }
  }, [content, dispatch])

  // nkang: WIP, will probably be moved:
  const handleShareToInstagramStory = useCallback(async () => {
    if (content?.type === 'track') {
      const encodedTrackId = encodeHashId(content.track.track_id)
      const streamMp3Url = apiClient.makeUrl(`/tracks/${encodedTrackId}/stream`)
      const storyVideoPath = path.join(
        RNFS.TemporaryDirectoryPath,
        `storyVideo-${uuid()}.mp4`
      )
      const audioStartOffsetConfig =
        content.track.duration && content.track.duration >= 20 ? '-ss 10 ' : ''
      const session = await FFmpegKit.execute(
        `${audioStartOffsetConfig}-i ${streamMp3Url} -filter_complex "gradients=n=2:type=linear:s=270x480:duration=10:speed=0.05:c0=#AA1F3B:c1=#671525:x0=0:x1=0:y0=0:y1=280,format=rgb0" -t 10 ${storyVideoPath}`
      )
      // TODO(nkang): Add loading state
      const returnCode = await session.getReturnCode()

      if (ReturnCode.isSuccess(returnCode)) {
      } else {
        const output = await session.getOutput()
        // TODO(nkang): Make this a toast?
        console.error('Error sharing story: ', output)
        return
      }

      const shareOptions = {
        backgroundVideo: storyVideoPath,
        // stickerImage: image, TODO(nkang): Base64 sticker image goes here
        attributionURL: Config.AUDIUS_URL,
        social: Share.Social.INSTAGRAM_STORIES,
        appId: Config.INSTAGRAM_APP_ID
      }
      try {
        await Share.shareSingle(shareOptions)
      } catch (error) {
        // TODO (nkang): Make this a toast?
        console.error('Error sharing story: ', error)
      }
    }
  }, [content.track.duration, content.track.track_id, content?.type])

  const handleCopyLink = useCallback(() => {
    if (!content) return
    const link = getContentUrl(content)
    Clipboard.setString(link)
    toast({ content: messages.toast(shareType), type: 'info' })
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

  const shouldIncludeTikTokAction = Boolean(
    isShareToTikTokEnabled &&
      content?.type === 'track' &&
      isOwner &&
      !content.track.is_unlisted &&
      !content.track.is_invalid &&
      !content.track.is_delete
  )

  const shouldIncludeInstagramStoryAction = Boolean(
    isShareToInstagramStoryEnabled &&
      content?.type === 'track' &&
      !content.track.is_unlisted &&
      !content.track.is_invalid &&
      !content.track.is_delete
  )

  const getRows = useCallback(() => {
    const shareToTwitterAction = {
      icon: <IconTwitterBird fill={staticTwitterBlue} height={20} width={26} />,
      text: messages.twitter,
      style: styles.shareToTwitterAction,
      callback: handleShareToTwitter
    }

    const TikTokIcon = isLightMode ? IconTikTok : IconTikTokInverted

    const shareToTikTokAction = {
      text: messages.tikTok,
      icon: <TikTokIcon height={26} width={26} />,
      style: isLightMode
        ? styles.shareToTikTokAction
        : styles.shareToTikTokActionDark,
      callback: handleShareToTikTok
    }

    const copyLinkAction = {
      text: messages.copyLink(shareType),
      icon: <IconLink height={26} width={26} fill={secondary} />,
      style: styles.copyLinkAction,
      callback: handleCopyLink
    }

    const shareSheetAction = {
      text: messages.shareSheet(shareType),
      icon: <IconShare height={26} width={26} fill={secondary} />,
      style: styles.copyLinkAction,
      callback: handleOpenShareSheet
    }

    const shareToInstagramStoriesAction = {
      text: messages.instagramStory,
      icon: <IconInstagram fill={primary} height={26} width={26} />,
      style: styles.shareToInstagramStoryAction,
      callback: handleShareToInstagramStory
    }

    const result: {
      text: string
      icon: React.ReactElement
      style: Record<string, string>
      callback: (() => void) | (() => Promise<void>)
    }[] = [shareToTwitterAction]

    if (shouldIncludeTikTokAction) {
      result.push(shareToTikTokAction)
    }
    if (shouldIncludeInstagramStoryAction) {
      result.push(shareToInstagramStoriesAction)
    }

    result.push(copyLinkAction, shareSheetAction)

    return result
  }, [
    staticTwitterBlue,
    styles.shareToTwitterAction,
    styles.shareToTikTokAction,
    styles.shareToTikTokActionDark,
    styles.copyLinkAction,
    styles.shareToInstagramStoryAction,
    handleShareToTwitter,
    isLightMode,
    handleShareToTikTok,
    shareType,
    secondary,
    handleCopyLink,
    handleOpenShareSheet,
    primary,
    handleShareToInstagramStory,
    shouldIncludeTikTokAction,
    shouldIncludeInstagramStoryAction
  ])

  return (
    <ActionDrawer
      modalName='Share'
      rows={getRows()}
      renderTitle={() => (
        <View style={styles.title}>
          <IconShare
            style={styles.titleIcon}
            fill={neutral}
            height={18}
            width={20}
          />
          <Text weight='bold' style={styles.titleText}>
            {messages.modalTitle(shareType)}
          </Text>
        </View>
      )}
      styles={{ row: styles.row }}
    />
  )
}
