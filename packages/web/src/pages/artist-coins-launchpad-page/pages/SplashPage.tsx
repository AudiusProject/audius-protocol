import { useArtistCoins, useCurrentUserId } from '@audius/common/api'
import { Flex, makeResponsiveStyles } from '@audius/harmony'

import gift from 'assets/fonts/emojis/gift.png'
import globe from 'assets/fonts/emojis/globe.png'
import moneyWithWingsEmoji from 'assets/fonts/emojis/money-with-wings.png'

import {
  LaunchPanel,
  WalletSetupCard,
  WhyCreateCard
} from '../components/index'

const messages = {
  whyCreateTitle: 'Why Create a Coin?',
  whyCreateDescription:
    'Create new ways to earn, reward your fans, and grow your community — all powered by your artist coin.',
  getPaidTitle: 'Get Paid',
  getPaidDescription: 'Earn fees whenever fans buy or sell your coin.',
  rewardFansTitle: 'Reward Fans',
  rewardFansDescription: 'Give holders exclusive content, music, or perks.',
  growCommunityTitle: 'Grow Community',
  growCommunityDescription: 'Strengthen bonds with your biggest supporters.',
  leftColumnPlaceholder: 'Left Column Content (716px)'
}

const features = [
  {
    title: messages.getPaidTitle,
    description: messages.getPaidDescription,
    imageSrc: moneyWithWingsEmoji
  },
  {
    title: messages.rewardFansTitle,
    description: messages.rewardFansDescription,
    imageSrc: gift
  },
  {
    title: messages.growCommunityTitle,
    description: messages.growCommunityDescription,
    imageSrc: globe
  }
]

// Using flex ratios: 2 for left section, 1 for right section (2:1 ratio)
// Based on Figma design with 1080px total width constraint

const useStyles = makeResponsiveStyles(({ media, theme }) => {
  const hasEnoughSpaceForTwoColumns = media.matchesQuery(`(min-width: 1440px)`)

  return {
    container: {
      base: {
        display: 'flex',
        gap: theme.spacing.l,
        width: '100%',
        maxWidth: hasEnoughSpaceForTwoColumns ? '1080px' : '100%',
        margin: '0 auto',
        flexDirection: hasEnoughSpaceForTwoColumns ? 'row' : 'column',
        paddingBottom: hasEnoughSpaceForTwoColumns ? 0 : theme.spacing.m
      }
    },
    leftSection: {
      base: {
        flex: hasEnoughSpaceForTwoColumns ? 2 : '1 1 auto',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.m,
        order: hasEnoughSpaceForTwoColumns ? 1 : 2
      }
    },
    rightSection: {
      base: {
        flex: hasEnoughSpaceForTwoColumns ? 1 : '1 1 auto',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.m,
        order: hasEnoughSpaceForTwoColumns ? 2 : 1,
        // Make sticky on desktop with proper header offset
        ...(hasEnoughSpaceForTwoColumns && {
          position: 'sticky',
          top: '161px',
          alignSelf: 'flex-start'
        })
      }
    }
  }
})

type SplashPageProps = {
  onContinue: () => void
  isPending: boolean
}

export const SplashPage = ({ onContinue, isPending }: SplashPageProps) => {
  const styles = useStyles()
  const { data: currentUserId } = useCurrentUserId()
  const { data: userCoins } = useArtistCoins({
    owner_id: currentUserId ? [currentUserId] : undefined
  })

  // Hide the launch panel if user already has an artist coin
  const hasArtistCoin = userCoins && userCoins.length > 0

  return (
    <Flex css={styles.container}>
      <Flex css={styles.leftSection}>
        <WhyCreateCard
          title={messages.whyCreateTitle}
          description={messages.whyCreateDescription}
          features={features}
        />
        <WalletSetupCard />
      </Flex>
      {!hasArtistCoin ? (
        <Flex css={styles.rightSection}>
          <LaunchPanel onContinue={onContinue} isPending={isPending} />
        </Flex>
      ) : null}
    </Flex>
  )
}
