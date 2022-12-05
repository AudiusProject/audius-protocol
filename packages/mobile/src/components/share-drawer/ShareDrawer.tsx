import React, { useCallback, useContext, useRef } from 'react'

import {
  accountSelectors,
  collectionsSocialActions,
  FeatureFlags,
  shareModalUISelectors,
  shareSoundToTiktokModalActions,
  tracksSocialActions,
  usersSocialActions
} from '@audius/common'
import Clipboard from '@react-native-clipboard/clipboard'
import { Linking, View } from 'react-native'
import ViewShot from 'react-native-view-shot'
import { useDispatch, useSelector } from 'react-redux'

import IconInstagram from 'app/assets/images/iconInstagram.svg'
import IconLink from 'app/assets/images/iconLink.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import IconTikTok from 'app/assets/images/iconTikTok.svg'
import IconTikTokInverted from 'app/assets/images/iconTikTokInverted.svg'
import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { Theme, useThemeColors, useThemeVariant } from 'app/utils/theme'

import ActionDrawer from '../action-drawer'
import { Text } from '../core'
import { ToastContext } from '../toast/ToastContext'

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
    textTransform: 'uppercase'
  },
  titleIcon: {
    marginRight: spacing(3)
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24
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

  const { isEnabled: isShareToTikTokEnabled } = useFeatureFlag(
    FeatureFlags.SHARE_SOUND_TO_TIKTOK
  )
  const { isEnabled: isShareToInstagramStoryEnabled } = useFeatureFlag(
    FeatureFlags.SHARE_TO_STORY
  )

  const { primary, secondary, neutralLight2, staticTwitterBlue } =
    useThemeColors()
  const themeVariant = useThemeVariant()
  const isLightMode = themeVariant === Theme.DEFAULT
  const dispatch = useDispatch()
  const content = useSelector(getShareContent)
  const source = useSelector(getShareSource)
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

  const {
    handleShareToStoryStickerLoad,
    handleShareToInstagramStory,
    shouldRenderShareToStorySticker
  } = useShareToStory({ content, viewShotRef })

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
    <>
      {/* Redundant `content?.type === 'track'` needed to make TS happy */}
      {content?.type === 'track' && shouldRenderShareToStorySticker ? (
        <ViewShot
          style={styles.viewShot}
          ref={viewShotRef}
          options={{ format: 'png' }}
        >
          <ShareToStorySticker
            onLoad={handleShareToStoryStickerLoad}
            track={content?.track}
            artist={content?.artist}
          />
        </ViewShot>
      ) : null}
      <ActionDrawer
        modalName='Share'
        rows={getRows()}
        renderTitle={() => (
          <View style={styles.title}>
            <IconShare
              style={styles.titleIcon}
              fill={neutralLight2}
              height={18}
              width={20}
            />
            <Text
              weight='heavy'
              color='neutralLight2'
              fontSize='xl'
              style={styles.titleText}
            >
              {messages.modalTitle(shareType)}
            </Text>
          </View>
        )}
        styles={{ row: styles.row }}
      />
    </>
  )
}
