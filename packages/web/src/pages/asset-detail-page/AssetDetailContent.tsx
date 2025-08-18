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
      gap: theme.spacing.l,
      width: '100%',
      maxWidth: `calc(${LEFT_SECTION_WIDTH} + ${RIGHT_SECTION_WIDTH} + ${theme.spacing.l})`,
      margin: '0 auto'
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
      maxWidth: LEFT_SECTION_WIDTH,
      minWidth: 0,
      flex: '0 0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.m
    },
    mobile: {
      width: '100%',
      maxWidth: '100%',
      flex: '1 1 auto'
    },
    tablet: {
      width: '100%',
      maxWidth: '100%',
      flex: '1 1 auto'
    }
  },
  rightSection: {
    base: {
      width: RIGHT_SECTION_WIDTH,
      maxWidth: RIGHT_SECTION_WIDTH,
      minWidth: 0,
      flex: '0 0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.m
    },
    mobile: {
      width: '100%',
      maxWidth: '100%',
      flex: '1 1 auto'
    },
    tablet: {
      width: '100%',
      maxWidth: '100%',
      flex: '1 1 auto'
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
