import { useCallback, useState } from 'react'

import type { CommonState } from '@audius/common'
import {
  uploadActions,
  cacheTracksSelectors,
  accountSelectors,
  trackPageActions,
  uploadSelectors
} from '@audius/common'
import Clipboard from '@react-native-clipboard/clipboard'
import { View, Image } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'
import { parseTrackRoute } from 'utils/route/trackRouteParser'

import { IconShare, IconCloudUpload } from '@audius/harmony-native'
import EmojiRaisedHands from 'app/assets/images/emojis/person-raising-both-hands-in-celebration.png'
import { Text, TextButton, Tile, Button } from 'app/components/core'
import {
  LineupTileSkeleton,
  TrackTileComponent
} from 'app/components/lineup-tile'
import { TwitterButton } from 'app/components/twitter-button'
import { useNavigation } from 'app/hooks/useNavigation'
import { FormScreen } from 'app/screens/edit-track-screen/components'
import { makeStyles } from 'app/styles'
import { getTrackRoute } from 'app/utils/routes'

const { getTracks } = uploadSelectors
const { reset } = uploadActions
const { getAccountUser } = accountSelectors
const { fetchTrack } = trackPageActions
const { getTrack } = cacheTracksSelectors

const messages = {
  title: 'Upload',
  complete: 'Upload Complete',
  share: 'Spread the word and share it with your fans!',
  twitterShareText: (title: string) =>
    `Check out my new track, ${title} on @audius #Audius`,
  copyLink: 'Copy Link',
  linkCopied: 'Link Copied!',
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
  // const track = { title: 'test title', permalink: '/dylan/test-track-6' }
  const track = useSelector(
    (state: CommonState) => getTracks(state)?.[0]?.metadata
  )
  const { title, permalink } = track!
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const accountUser = useSelector(getAccountUser)
  const uploadedTrack = useSelector((state) => getTrack(state, { permalink }))
  const trackRoute = getTrackRoute(track!, true)
  const [isLinkCopied, setIsLinkCopied] = useState(false)

  useEffectOnce(() => {
    const params = parseTrackRoute(permalink)
    if (params) {
      const { slug, handle } = params
      dispatch(fetchTrack(null, slug!, handle!))
    }
  })

  const handleCopyLink = useCallback(() => {
    Clipboard.setString(trackRoute)
    setIsLinkCopied(true)
  }, [trackRoute])

  const handleClose = useCallback(() => {
    navigation.getParent()?.goBack()
    dispatch(reset())
  }, [navigation, dispatch])

  const handlePressTrack = useCallback(() => {
    handleClose()
    navigation.push('Track', { id: uploadedTrack?.track_id })
  }, [handleClose, navigation, uploadedTrack])

  const handleDone = useCallback(() => {
    handleClose()
    navigation.push('Profile', { handle: 'accountUser' })
  }, [handleClose, navigation])

  return (
    <FormScreen
      title={messages.title}
      icon={IconCloudUpload}
      variant='secondary'
      topbarLeft={null}
      url='/upload-complete'
      bottomSection={
        <Button
          variant='primary'
          size='large'
          title={messages.close}
          fullWidth
          onPress={handleDone}
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
          {!track?.is_unlisted ? (
            <>
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
                title={isLinkCopied ? messages.linkCopied : messages.copyLink}
                style={styles.shareButton}
                onPress={handleCopyLink}
                TextProps={{ variant: 'h3', noGutter: true }}
                IconProps={{ height: 14, width: 14 }}
              />
            </>
          ) : null}
        </Tile>
        {accountUser && uploadedTrack ? (
          <TrackTileComponent
            uid={''}
            index={0}
            togglePlay={() => {}}
            track={uploadedTrack}
            user={accountUser}
            TileProps={{
              pointerEvents: 'box-only',
              onPress: handlePressTrack
            }}
          />
        ) : (
          <LineupTileSkeleton />
        )}
      </View>
    </FormScreen>
  )
}
