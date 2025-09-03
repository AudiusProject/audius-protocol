import { Flex, makeResponsiveStyles } from '@audius/harmony'

import gift from 'assets/fonts/emojis/gift.png'
import globe from 'assets/fonts/emojis/globe.png'
import moneyWithWingsEmoji from 'assets/fonts/emojis/money-with-wings.png'

import {
  ArtistCoinsLaunchPanel,
  ArtistCoinsWalletSetupCard,
  ArtistCoinsWhyCreateCard
} from './index'

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

const LEFT_SECTION_WIDTH = '716px'
const RIGHT_SECTION_WIDTH = '348px'

const useStyles = makeResponsiveStyles(({ media, theme }) => {
  const hasEnoughSpaceForTwoColumns = media.matchesQuery(`(min-width: 1440px)`)

  return {
    container: {
      base: {
        display: 'flex',
        gap: theme.spacing.l,
        width: '100%',
        maxWidth: hasEnoughSpaceForTwoColumns
          ? `calc(${LEFT_SECTION_WIDTH} + ${RIGHT_SECTION_WIDTH} + ${theme.spacing.l})`
          : '100%',
        margin: '0 auto',
        flexDirection: hasEnoughSpaceForTwoColumns ? 'row' : 'column',
        paddingBottom: hasEnoughSpaceForTwoColumns ? 0 : theme.spacing.m
      }
    },
    leftSection: {
      base: {
        width: hasEnoughSpaceForTwoColumns ? LEFT_SECTION_WIDTH : '100%',
        maxWidth: hasEnoughSpaceForTwoColumns ? LEFT_SECTION_WIDTH : '100%',
        minWidth: 0,
        flex: hasEnoughSpaceForTwoColumns ? '0 0 auto' : '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.m,
        order: hasEnoughSpaceForTwoColumns ? 1 : 2
      }
    },
    rightSection: {
      base: {
        width: hasEnoughSpaceForTwoColumns ? RIGHT_SECTION_WIDTH : '100%',
        maxWidth: hasEnoughSpaceForTwoColumns ? RIGHT_SECTION_WIDTH : '100%',
        minWidth: 0,
        flex: hasEnoughSpaceForTwoColumns ? '0 0 auto' : '1 1 auto',
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

type SplashScreenProps = {
  onContinue: () => void
}

export const SplashScreen = ({ onContinue }: SplashScreenProps) => {
  const styles = useStyles()

  return (
    <Flex css={styles.container}>
      <Flex css={styles.leftSection}>
        <ArtistCoinsWhyCreateCard
          title={messages.whyCreateTitle}
          description={messages.whyCreateDescription}
          features={features}
        />
        <ArtistCoinsWalletSetupCard />
      </Flex>
      <Flex css={styles.rightSection}>
        <ArtistCoinsLaunchPanel onContinue={onContinue} />
      </Flex>
    </Flex>
  )
}
