import { useCallback, useEffect } from 'react'

import {
  lineupSelectors,
  aiPageLineupActions as tracksActions,
  aiPageActions,
  aiPageSelectors
} from '@audius/common'
import { TouchableOpacity, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { IconRobot } from '@audius/harmony-native'
import { Text, Screen, ScreenContent, ScreenHeader } from 'app/components/core'
import { Lineup } from 'app/components/lineup'
import UserBadges from 'app/components/user-badges'
import { useNavigation } from 'app/hooks/useNavigation'
import { useProfileRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

import { ShareAiTracksTile } from './ShareAiTracksTile'

const { makeGetLineupMetadatas } = lineupSelectors
const { getAiUser, getLineup } = aiPageSelectors
const { fetchAiUser, reset } = aiPageActions

const getAiTracksLineup = makeGetLineupMetadatas(getLineup)

const messages = {
  header: 'AI Generated Tracks',
  headerText: 'Tracks generated with AI trained on music by '
}

const iconSize = { height: spacing(6), width: spacing(6) }

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing(7),
    paddingVertical: spacing(3),
    backgroundColor: palette.white
  },
  headerText: {
    fontSize: typography.fontSize.medium,
    lineHeight: typography.fontSize.medium * 1.3,
    textAlign: 'left'
  },
  userBadgeTitle: {
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontByWeight.medium,
    color: palette.secondary
  }
}))

export const AiGeneratedTracksScreen = () => {
  const styles = useStyles()
  const navigation = useNavigation()
  const { params } = useProfileRoute<'AiGeneratedTracks'>()
  const { userId } = params
  const dispatch = useDispatch()
  const lineup = useSelector(getAiTracksLineup)
  const user = useSelector(getAiUser)

  useEffect(() => {
    dispatch(fetchAiUser({ userId }))
    return function cleanup() {
      dispatch(reset())
      dispatch(tracksActions.reset())
    }
  }, [dispatch, userId])

  useEffect(() => {
    if (user?.handle) {
      dispatch(
        tracksActions.fetchLineupMetadatas(0, 10, false, {
          aiUserHandle: user.handle
        })
      )
    }
  }, [dispatch, user])

  const loadMore = useCallback(
    (offset: number, limit: number, overwrite: boolean) => {
      if (user?.handle) {
        dispatch(
          tracksActions.fetchLineupMetadatas(offset, limit, overwrite, {
            aiUserHandle: user.handle
          })
        )
      }
    },
    [dispatch, user]
  )

  const handleGoToProfile = useCallback(() => {
    navigation.navigate('Profile', { id: userId })
  }, [navigation, userId])

  return (
    <Screen>
      <ScreenHeader
        text={messages.header}
        icon={IconRobot}
        iconProps={iconSize}
      />
      <ScreenContent>
        <Lineup
          header={
            user ? (
              <View style={styles.header}>
                <Text>{messages.headerText}</Text>
                <TouchableOpacity onPress={handleGoToProfile}>
                  <UserBadges user={user} nameStyle={styles.userBadgeTitle} />
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListFooterComponent={<ShareAiTracksTile />}
          actions={tracksActions}
          lineup={lineup}
          loadMore={loadMore}
        />
      </ScreenContent>
    </Screen>
  )
}
