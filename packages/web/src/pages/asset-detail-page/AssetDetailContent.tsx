import { Flex, makeResponsiveStyles } from '@audius/harmony'

import { AssetInfoSection } from './components/AssetInfoSection'
import { AssetInsights } from './components/AssetInsights'
import { AssetLeaderboardCard } from './components/AssetLeaderboardCard'
import { BalanceSection } from './components/BalanceSection'
import { ExternalWallets } from './components/ExternalWallets'
import { AssetDetailProps } from './types'

const LEFT_SECTION_WIDTH = '704px'
const RIGHT_SECTION_WIDTH = '360px'

const useStyles = makeResponsiveStyles(({ media, theme }) => ({
  container: {
    base: {
      display: 'flex',
      gap: theme.spacing.l
    },
    mobile: {
      flexDirection: 'column',
      width: '100%',
      paddingBottom: theme.spacing.m
    },
    tablet: {
      flexDirection: 'column',
      width: '100%'
    }
  },
  leftSection: {
    base: {
      width: LEFT_SECTION_WIDTH,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.m
    },
    mobile: {
      width: '100%'
    },
    tablet: {
      width: '100%'
    }
  },
  rightSection: {
    base: {
      width: RIGHT_SECTION_WIDTH,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.m
    },
    mobile: {
      width: '100%'
    },
    tablet: {
      width: '100%'
    }
  }
}))

export const AssetDetailContent = ({ mint }: AssetDetailProps) => {
  const styles = useStyles()

  return (
    <Flex css={styles.container}>
      <Flex css={styles.leftSection}>
        <BalanceSection mint={mint} />
        <AssetInfoSection mint={mint} />
      </Flex>
      <Flex css={styles.rightSection}>
        <AssetInsights mint={mint} />
        <AssetLeaderboardCard mint={mint} />
        <ExternalWallets mint={mint} />
      </Flex>
    </Flex>
  )
}
