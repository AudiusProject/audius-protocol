import { useCallback, useContext } from 'react'

import type { CommonState } from '@audius/common'
import { uploadSelectors } from '@audius/common'
import Clipboard from '@react-native-clipboard/clipboard'
import { View, Image } from 'react-native'
import { useSelector } from 'react-redux'

import EmojiRaisedHands from 'app/assets/images/emojis/person-raising-both-hands-in-celebration.png'
import IconShare from 'app/assets/images/iconShare.svg'
import IconUpload from 'app/assets/images/iconUpload.svg'
import { Text, TextButton, Tile, Button } from 'app/components/core'
import { LineupTileSkeleton } from 'app/components/lineup-tile'
import { ToastContext } from 'app/components/toast/ToastContext'
import { TwitterButton } from 'app/components/twitter-button'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { getTrackRoute } from 'app/utils/routes'

import { UploadStackScreen } from './UploadStackScreen'
const { getTracks } = uploadSelectors

const messages = {
  title: 'Upload',
  complete: 'Upload Complete',
  share: 'Spread the work and share it with your fans!',
  twitterShareText: (title: string) =>
    `Check out my new track, ${title} on @AudiusProject #Audius`,
  copyLink: 'Copy Link',
  shareToast: 'Copied Link to Track',
  close: 'Close'
}

const useStyles = makeStyles(({ spacing }) => ({
  content: { paddingHorizontal: spacing(3), paddingVertical: spacing(7) },
  completedTile: {
    marginBottom: spacing(4)
  },
  completedTileContent: {
    padding: spacing(4),
    alignItems: 'center'
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(4)
  },
  titleIcon: {
    height: spacing(6),
    width: spacing(6),
    marginRight: spacing(2)
  },
  description: {
    marginBottom: spacing(4)
  },
  shareButton: {
    marginTop: spacing(4),
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(2)
  }
}))

export const UploadCompleteScreen = () => {
  const styles = useStyles()
  const track = useSelector(
    (state: CommonState) => getTracks(state)?.[0]?.metadata
  )
  const { title } = track!
  const { toast } = useContext(ToastContext)
  const navigation = useNavigation()

  const handleCopyLink = useCallback(() => {
    const link = ''
    Clipboard.setString(link)
    toast({ content: messages.shareToast, type: 'info' })
  }, [toast])

  const handleClose = useCallback(() => {
    navigation.navigate('Feed')
  }, [navigation])

  return (
    <UploadStackScreen
      title={messages.title}
      icon={IconUpload}
      variant='secondary'
      bottomSection={
        <Button
          variant='primary'
          size='large'
          title={messages.close}
          fullWidth
          onPress={handleClose}
        />
      }
    >
      <View style={styles.content}>
        <Tile
          styles={{
            root: styles.completedTile,
            content: styles.completedTileContent
          }}
        >
          <View style={styles.title}>
            <Image source={EmojiRaisedHands} style={styles.titleIcon} />
            <Text fontSize='xxl' weight='bold' color='neutralLight4'>
              {messages.complete}
            </Text>
          </View>
          <Text variant='body' style={styles.description}>
            {messages.share}
          </Text>
          <TwitterButton
            type='static'
            size='large'
            fullWidth
            url={getTrackRoute(track!, true)}
            shareText={messages.twitterShareText(title)}
          />
          <TextButton
            variant='neutralLight4'
            icon={IconShare}
            title={messages.copyLink}
            style={styles.shareButton}
            onPress={handleCopyLink}
            TextProps={{ variant: 'h3', noGutter: true }}
            IconProps={{ height: 14, width: 14 }}
          />
        </Tile>
        <LineupTileSkeleton />
      </View>
    </UploadStackScreen>
  )
}
