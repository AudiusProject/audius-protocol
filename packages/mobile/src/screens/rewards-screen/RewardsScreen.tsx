import { useCallback, useEffect } from 'react'

import { StringKeys } from '@audius/common/services'
import {
  tokenDashboardPageActions,
  walletSelectors,
  walletActions
} from '@audius/common/store'
import { useFocusEffect } from '@react-navigation/native'
import LinearGradient from 'react-native-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'

import { Flex, IconCrown } from '@audius/harmony-native'
import {
  ScrollView,
  Screen,
  Text,
  Tile,
  ScreenContent
} from 'app/components/core'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { useToast } from 'app/hooks/useToast'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { ChallengeRewardsTile } from './ChallengeRewardsTile'
import { RewardsClaimTile } from './RewardsClaimTile'

const { getBalance } = walletActions
const { getTotalBalanceLoadDidFail } = walletSelectors
const { fetchAssociatedWallets } = tokenDashboardPageActions

const messages = {
  title: '$AUDIO & Rewards',
  rewards: 'Earn Rewards',
  rewardsBody1: 'Complete tasks to earn $AUDIO tokens!'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  tiles: {
    height: '100%',
    padding: spacing(3)
  },
  tileRoot: {
    margin: spacing(3),
    padding: spacing(3)
  },
  tile: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(4),
    minHeight: 200
  },
  tileContent: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileHeader: {
    fontFamily: typography.fontByWeight.heavy,
    fontSize: typography.fontSize.xxxxl,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16
  },
  tileSubheader: {
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.medium,
    lineHeight: spacing(5),
    textAlign: 'center',
    marginBottom: spacing(6)
  },
  noticeTile: {
    padding: spacing(2)
  },
  noticeTileText: {
    color: palette.staticStaticWhite
  }
}))

export const RewardsScreen = () => {
  const styles = useStyles()
  const { pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const audioFeaturesDegradedText = useRemoteVar(
    StringKeys.AUDIO_FEATURES_DEGRADED_TEXT
  )

  const balanceLoadDidFail = useSelector(getTotalBalanceLoadDidFail)

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchAssociatedWallets())
      dispatch(getBalance())
    }, [dispatch])
  )

  useEffect(() => {
    if (balanceLoadDidFail) {
      toast({
        content: 'Balance failed to load. Please try again later.',
        type: 'error',
        timeout: 10000
      })
    }
  }, [balanceLoadDidFail, toast])

  const renderNoticeTile = () => (
    <Tile
      as={LinearGradient}
      colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 0 }}
      styles={{
        root: styles.tileRoot,
        tile: styles.noticeTile,
        content: styles.tileContent
      }}
    >
      <Text style={styles.noticeTileText}>{audioFeaturesDegradedText}</Text>
    </Tile>
  )

  return (
    <Screen
      url='/audio'
      variant='secondary'
      icon={IconCrown}
      title={messages.title}
    >
      <ScreenContent>
        <ScrollView style={styles.tiles}>
          <Flex gap='xl'>
            {audioFeaturesDegradedText ? renderNoticeTile() : null}
            <RewardsClaimTile />
            <ChallengeRewardsTile />
          </Flex>
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
