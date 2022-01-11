import React, { useCallback, useContext } from 'react'

import Clipboard from '@react-native-clipboard/clipboard'
import { CommonState } from 'audius-client/src/common/store'
import { getAccountUser } from 'audius-client/src/common/store/account/selectors'
import { getUser } from 'audius-client/src/common/store/cache/users/selectors'
import { shareTrack } from 'audius-client/src/common/store/social/tracks/actions'
import {
  getModalVisibility,
  setVisibility
} from 'audius-client/src/common/store/ui/modals/slice'
import {
  getSource,
  getTrack
} from 'audius-client/src/common/store/ui/share-modal/selectors'
import { requestOpen as requestOpenTikTokModal } from 'audius-client/src/common/store/ui/share-sound-to-tiktok-modal/slice'
import { Linking, StyleSheet, View } from 'react-native'

import IconLink from 'app/assets/images/iconLink.svg'
import IconShare from 'app/assets/images/iconShare.svg'
import IconTikTok from 'app/assets/images/iconTikTok.svg'
import IconTikTokInverted from 'app/assets/images/iconTikTokInverted.svg'
import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import Text from 'app/components/text'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { getTrackRoute } from 'app/utils/routes'
import {
  Theme,
  ThemeColors,
  useThemeColors,
  useThemeVariant
} from 'app/utils/theme'
import { getTwitterLink } from 'app/utils/twitter'

import ActionDrawer from '../action-drawer'
import { ToastContext } from '../toast/ToastContext'

const messages = {
  modalTitle: 'Share Track',
  twitter: 'Share to Twitter',
  tikTok: 'Share Sound to TikTok',
  copyLink: 'Copy Track to Link',
  shareSheet: 'Share Track via...'
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    shareToTwitterAction: {
      color: themeColors.staticTwitterBlue
    },
    shareToTikTokAction: {
      color: 'black'
    },
    shareToTikTokActionDark: {
      color: themeColors.staticWhite
    },
    copyLinkAction: {
      color: themeColors.secondary
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
  })

export const ShareDrawer = () => {
  const styles = useThemedStyles(createStyles)
  const { secondary, neutral, staticTwitterBlue } = useThemeColors()
  const themeVariant = useThemeVariant()
  const isDarkMode = themeVariant === Theme.DARK
  const dispatchWeb = useDispatchWeb()
  const isOpen = useSelectorWeb(state => getModalVisibility(state, 'Share'))
  const track = useSelectorWeb(getTrack)
  const artist = useSelectorWeb((state: CommonState) =>
    getUser(state, { id: track?.owner_id })
  )
  const account = useSelectorWeb(getAccountUser)
  const source = useSelectorWeb(getSource)

  const { toast } = useContext(ToastContext)

  const isOwner = Boolean(
    account && artist && account.user_id === artist.user_id
  )

  const handleClose = useCallback(() => {
    dispatchWeb(setVisibility({ modal: 'Share', visible: false }))
  }, [dispatchWeb])

  const handleShareToTwitter = useCallback(async () => {
    const twitterText = `Check out ${track.title} by ${artist.handle} on @AudiusProject #Audius`
    const trackUrl = getTrackRoute(track, true)
    const twitterShareUrl = getTwitterLink(trackUrl, twitterText)
    const isSupported = await Linking.canOpenURL(twitterShareUrl)
    if (isSupported) {
      Linking.openURL(twitterShareUrl)
    } else {
      console.error(`Can't open: ${twitterShareUrl}`)
    }
    handleClose()
  }, [track, artist, handleClose])

  const handleShareToTikTok = useCallback(() => {
    dispatchWeb(requestOpenTikTokModal({ id: track.track_id }))
    handleClose()
  }, [dispatchWeb, track, handleClose])

  const handleCopyLink = useCallback(() => {
    const trackUrl = getTrackRoute(track, true)
    Clipboard.setString(trackUrl)
    toast({ content: 'Copied Link to Track', type: 'info' })
    handleClose()
  }, [toast, track, handleClose])

  const handleOpenShareSheet = useCallback(() => {
    dispatchWeb(shareTrack(track.track_id, source))
    handleClose()
  }, [dispatchWeb, track, source, handleClose])

  const shouldIncludeTikTokAction =
    isOwner && !track.is_invalid && !track.is_delete

  const getRows = useCallback(() => {
    const shareToTwitterAction = {
      icon: <IconTwitterBird fill={staticTwitterBlue} height={20} width={26} />,
      text: messages.twitter,
      style: styles.shareToTwitterAction,
      callback: handleShareToTwitter
    }

    const TikTokIcon = isDarkMode ? IconTikTokInverted : IconTikTok

    const shareToTikTokAction = {
      text: messages.tikTok,
      icon: <TikTokIcon height={26} width={26} />,
      style: isDarkMode
        ? styles.shareToTikTokActionDark
        : styles.shareToTikTokAction,
      callback: handleShareToTikTok
    }

    const copyLinkAction = {
      text: messages.copyLink,
      icon: <IconLink height={26} width={26} fill={secondary} />,
      style: styles.copyLinkAction,
      callback: handleCopyLink
    }

    const shareSheetAction = {
      text: messages.shareSheet,
      icon: <IconShare height={26} width={26} fill={secondary} />,
      style: styles.copyLinkAction,
      callback: handleOpenShareSheet
    }

    return shouldIncludeTikTokAction
      ? [
          shareToTwitterAction,
          shareToTikTokAction,
          copyLinkAction,
          shareSheetAction
        ]
      : [shareToTwitterAction, copyLinkAction, shareSheetAction]
  }, [
    staticTwitterBlue,
    styles,
    handleShareToTwitter,
    isDarkMode,
    handleShareToTikTok,
    secondary,
    handleCopyLink,
    handleOpenShareSheet,
    shouldIncludeTikTokAction
  ])

  return (
    <ActionDrawer
      isOpen={isOpen}
      onClose={handleClose}
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
            {messages.modalTitle}
          </Text>
        </View>
      )}
      styles={{ row: styles.row }}
    />
  )
}
