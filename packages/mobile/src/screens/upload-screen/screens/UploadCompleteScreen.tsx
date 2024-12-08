import { useCallback, useState } from 'react'

import { Name, ShareSource } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import type { CommonState } from '@audius/common/store'
import {
  accountSelectors,
  cacheTracksSelectors,
  shareModalUIActions,
  trackPageActions,
  uploadActions,
  uploadSelectors
} from '@audius/common/store'
import { make } from '@audius/web/src/common/store/analytics/actions'
import Clipboard from '@react-native-clipboard/clipboard'
import { View, Image } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useEffectOnce } from 'react-use'
import { parseTrackRoute } from 'utils/route/trackRouteParser'

import {
  IconShare,
  IconCloudUpload,
  Button,
  IconMessage,
  Flex
} from '@audius/harmony-native'
import EmojiRaisedHands from 'app/assets/images/emojis/person-raising-both-hands-in-celebration.png'
import { Text, PlainButton, Tile } from 'app/components/core'
import {
  LineupTileSkeleton,
  TrackTileComponent
} from 'app/components/lineup-tile'
import { TwitterButton } from 'app/components/twitter-button'
import { useNavigation } from 'app/hooks/useNavigation'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { FormScreen } from 'app/screens/form-screen'
import { makeStyles } from 'app/styles'
import { getTrackRoute } from 'app/utils/routes'

const { getTracks } = uploadSelectors
const { reset } = uploadActions
const { getAccountUser } = accountSelectors
const { fetchTrack } = trackPageActions
const { getTrack } = cacheTracksSelectors
const { requestOpen: requestOpenShareModal } = shareModalUIActions

const messages = {
  title: 'Upload',
  complete: 'Upload Complete',
  share: 'Share your new track with your fans!',
  twitterShareText: (title: string) =>
    `Check out my new track, ${title} on @audius #Audius $AUDIO`,
  copyLink: 'Copy Link',
  linkCopied: 'Link Copied!',
  shareToast: 'Copied Link to Track',
  directMessageButton: 'Direct Message',
  shareButton: 'Share',
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
  const { title, permalink } = track!
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const accountUser = useSelector(getAccountUser)
  const uploadedTrack = useSelector((state) => getTrack(state, { permalink }))
  const trackRoute = getTrackRoute(track!, true)
  const [isLinkCopied, setIsLinkCopied] = useState(false)

  const { isEnabled: isOneToManyDmsEnabled } = useFeatureFlag(
    FeatureFlags.ONE_TO_MANY_DMS
  )

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

  const handleShare = useCallback(() => {
    if (!track?.track_id) return
    dispatch(
      requestOpenShareModal({
        type: 'track',
        trackId: track.track_id,
        source: ShareSource.UPLOAD
      })
    )
    handleClose()
  }, [dispatch, handleClose, track?.track_id])

  const handleShareToDirectMessage = useCallback(async () => {
    dispatch(
      navigation.navigate('ChatUserList', {
        presetMessage: trackRoute,
        defaultUserList: 'chats'
      })
    )
    dispatch(make(Name.CHAT_ENTRY_POINT, { source: 'upload' }))
    handleClose()
  }, [dispatch, handleClose, navigation, trackRoute])

  const legacyShareButtons = (
    <>
      <TwitterButton
        type='static'
        fullWidth
        url={getTrackRoute(track!, true)}
        shareText={messages.twitterShareText(title)}
      />
      <PlainButton
        variant='subdued'
        iconLeft={IconShare}
        style={styles.shareButton}
        onPress={handleCopyLink}
      >
        {isLinkCopied ? messages.linkCopied : messages.copyLink}
      </PlainButton>
    </>
  )

  return (
    <FormScreen
      title={messages.title}
      icon={IconCloudUpload}
      variant='secondary'
      topbarLeft={null}
      url='/upload-complete'
      bottomSection={
        <Button variant='primary' fullWidth onPress={handleDone}>
          {messages.close}
        </Button>
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
            <Text fontSize='xxl' weight='bold'>
              {messages.complete}
            </Text>
          </View>
          {!track?.is_unlisted ? (
            <>
              <Text variant='body' style={styles.description}>
                {messages.share}
              </Text>
              {!isOneToManyDmsEnabled ? (
                legacyShareButtons
              ) : (
                <Flex w='100%' column gap='s' alignItems='center'>
                  <Button
                    variant='secondary'
                    iconLeft={IconMessage}
                    onPress={handleShareToDirectMessage}
                    fullWidth
                  >
                    {messages.directMessageButton}
                  </Button>
                  <Button
                    variant='secondary'
                    iconLeft={IconShare}
                    onPress={handleShare}
                    fullWidth
                  >
                    {messages.shareButton}
                  </Button>
                </Flex>
              )}
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
