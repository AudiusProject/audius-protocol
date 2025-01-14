import { useCallback } from 'react'

import { Name, ShareSource } from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import {
  accountSelectors,
  cacheTracksSelectors,
  shareModalUIActions,
  uploadActions,
  uploadSelectors
} from '@audius/common/store'
import { make } from '@audius/web/src/common/store/analytics/actions'
import { View, Image } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import {
  IconShare,
  IconCloudUpload,
  Button,
  IconMessage,
  Flex
} from '@audius/harmony-native'
import EmojiRaisedHands from 'app/assets/images/emojis/person-raising-both-hands-in-celebration.png'
import { Text, Tile } from 'app/components/core'
import {
  LineupTileSkeleton,
  TrackTileComponent
} from 'app/components/lineup-tile'
import { useNavigation } from 'app/hooks/useNavigation'
import { FormScreen } from 'app/screens/form-screen'
import { makeStyles } from 'app/styles'
import { getTrackRoute } from 'app/utils/routes'

const { getTracks } = uploadSelectors
const { reset } = uploadActions
const { getAccountUser } = accountSelectors
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
  const { permalink } = track!
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const accountUser = useSelector(getAccountUser)
  const uploadedTrack = useSelector((state) => getTrack(state, { permalink }))
  const trackRoute = getTrackRoute(track!, true)

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
