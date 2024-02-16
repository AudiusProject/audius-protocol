import {
  Box,
  Flex,
  HarmonyTheme,
  IconAudiusLogoHorizontal,
  IconDrag,
  Text,
  useTheme
} from '@audius/harmony'
import ApiCallsStat from 'components/ApiCallsStat'
import Button, { ButtonType } from 'components/Button'
import EstimatedAnnualStat from 'components/EstimatedAnnualStat'
import EstimatedWeeklyStat from 'components/EstimatedWeeklyStat'
import Loading from 'components/Loading'
import Page from 'components/Page'
import Paper from 'components/Paper'
import Proposal from 'components/Proposal'
import { NoProposals } from 'components/Proposals'
import TopAddressesTable from 'components/TopAddressesTable'
import TotalStakedStat from 'components/TotalStakedStat'
import UniqueUsersStat from 'components/UniqueUsersStat'
import { useAccount } from 'store/account/hooks'
import { useProposals } from 'store/cache/proposals/hooks'
import { TICKER } from 'utils/consts'
import { usePushRoute } from 'utils/effects'
import {
  AUDIUS_API_URL,
  AUDIUS_DAPP_URL,
  GOVERNANCE,
  OAF_URL,
  WHITEPAPER_URL
} from 'utils/routes'

import { Card } from 'components/Card/Card'
import { ManageAccountCard } from 'components/ManageAccountCard/ManageAccountCard'
import { RewardsTimingCard } from 'components/RewardsTimingCard/RewardsTimingCard'
import { StatLabel } from 'components/StatLabel/StatLabel'
import { createStyles } from 'utils/mobile'
import desktopStyles from './Home.module.css'
import mobileStyles from './HomeMobile.module.css'
import { InfoCard } from './InfoCard'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'Overview',
  uniqueMonthlyUsers: 'Unique Monthly Users',
  globalStakedAudio: `Global Staked ${TICKER}`,
  estimatedRewardRate: `Estimated ${TICKER} Reward Rate`,
  apiCalls: 'Monthly API Calls',
  recentProposals: 'Recent Proposals',
  noProposals: 'No Recent Proposals',
  viewAllProposals: 'View All Proposals',
  wtfIsAudius: 'What is Audius?',
  wtf1: `Audius is not just a digital streaming platform; it's a revolution that connects fans and artists, bringing exclusive new music to your fingertips.`,
  launchAudius: 'Launch Audius',
  trustedNameTitle: 'Trusted Name in Music Innovation',
  trustedNameDescription:
    'Launched in 2018 and backed by an all-star team of investors, Audius has grown to serve millions of users monthly, standing as the largest non-financial crypto application to date.',
  trustedNameCTA: 'Open Audio Foundation',
  powerOfDecentralizationTitle: 'The Power of Decentralization',
  powerOfDecentralizationDescription:
    'Owned and operated by a diverse community of artists, fans, and developers globally, Audius empowers artists to share unique content and monetize streams directly.',
  powerOfDecentralizationCTA: 'Read The White Paper',
  developerFriendlyTitle: 'Developer Friendly',
  developerFriendlyDescription:
    'Unlock the potential of music innovation with Audius. Our robust API gives access to hundreds of thousands of songs, offering unparalleled opportunities for creativity.',
  developerFriendlyCTA: 'API Documentation'
}

const Home = () => {
  const { isLoggedIn } = useAccount()
  const { recentProposals } = useProposals()
  const pushRoute = usePushRoute()
  const { typography } = useTheme() as HarmonyTheme

  return (
    <Page icon={IconDrag} title={messages.title} hidePreviousPage>
      <Flex direction="column" gap="l">
        <Card direction="column" gap="xl" p="xl">
          <Flex
            w="100%"
            direction="column"
            alignItems="center"
            justifyContent="center"
          >
            <UniqueUsersStat
              color="heading"
              variant="display"
              strength="strong"
              size="l"
            />
            <StatLabel variant="heading" strength="default" size="m">
              {messages.uniqueMonthlyUsers}
            </StatLabel>
          </Flex>
          <Flex gap="s" w="100%" justifyContent="space-around">
            <Flex
              direction="column"
              alignItems="center"
              justifyContent="center"
            >
              <TotalStakedStat
                color="heading"
                variant="display"
                strength="strong"
                size="s"
              />
              <StatLabel variant="title" size="l" strength="default">
                {messages.globalStakedAudio}
              </StatLabel>
            </Flex>
            <Flex
              direction="column"
              alignItems="center"
              justifyContent="center"
            >
              <ApiCallsStat
                variant="display"
                strength="strong"
                size="s"
                color="heading"
              />
              <StatLabel variant="title" size="l" strength="default">
                {messages.apiCalls}
              </StatLabel>
            </Flex>
          </Flex>
        </Card>
        <Card pv="l" ph="xl" justifyContent="space-around" alignItems="center">
          <Text variant="heading" color="subdued" size="s" strength="default">
            {messages.estimatedRewardRate}
          </Text>
          <EstimatedWeeklyStat />
          <EstimatedAnnualStat />
        </Card>
        {isLoggedIn && <ManageAccountCard />}
        <RewardsTimingCard />
        <Paper className={styles.proposals}>
          <Box p="xl">
            <Text variant="heading" size="s" strength="default" tag="span">
              {messages.recentProposals}
            </Text>
          </Box>
          <div className={styles.list}>
            {!!recentProposals ? (
              recentProposals.length > 0 ? (
                recentProposals.map((proposal, i) => (
                  <Proposal key={i} proposal={proposal} />
                ))
              ) : (
                <NoProposals text={messages.noProposals} />
              )
            ) : (
              <Loading className={styles.loading} />
            )}
          </div>
          <div
            onClick={() => pushRoute(GOVERNANCE)}
            className={styles.moreText}
          >
            {messages.viewAllProposals}
          </div>
        </Paper>
        <TopAddressesTable limit={5} alwaysShowMore />
        <Paper className={styles.wtf}>
          <div className={styles.bg} />
          <Flex direction="column" gap="2xl" css={{ maxWidth: 488 }}>
            <IconAudiusLogoHorizontal
              color="staticWhite"
              className={styles.logo}
            />
            <Flex gap="l" direction="column">
              <Text
                color="staticWhite"
                variant="heading"
                size="l"
                strength="default"
              >
                {messages.wtfIsAudius}
              </Text>
              <Text
                variant="body"
                color="staticWhite"
                size="l"
                strength="default"
              >
                {messages.wtf1}
              </Text>
            </Flex>
            <Button
              onClick={() => {
                window.open(AUDIUS_DAPP_URL, '_blank')
              }}
              type={ButtonType.WHITE}
              text={messages.launchAudius}
              css={{
                '& span': { fontWeight: `${typography.weight.bold} !important` }
              }}
            />
          </Flex>
        </Paper>
        <InfoCard
          title={messages.trustedNameTitle}
          description={messages.trustedNameDescription}
          ctaLink={OAF_URL}
          ctaText={messages.trustedNameCTA}
        />
        <Flex gap="l">
          <InfoCard
            title={messages.powerOfDecentralizationTitle}
            description={messages.powerOfDecentralizationDescription}
            ctaLink={WHITEPAPER_URL}
            ctaText={messages.powerOfDecentralizationCTA}
          />
          <InfoCard
            title={messages.developerFriendlyTitle}
            description={messages.developerFriendlyDescription}
            ctaLink={AUDIUS_API_URL}
            ctaText={messages.developerFriendlyCTA}
          />
        </Flex>
      </Flex>
    </Page>
  )
}

export default Home
