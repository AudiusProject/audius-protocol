import { Box, Flex, Text } from '@audius/harmony'
import Button, { ButtonType } from 'components/Button'
import { Card } from 'components/Card/Card'
import Loading from 'components/Loading'
import { useEffect, useState } from 'react'
import { useClaimMetadata } from 'store/cache/claims/hooks'
import { useEthBlockNumber, useTimeRemaining } from 'store/cache/protocol/hooks'
import { Status } from 'types'
import { formatNumber, getHumanReadableTime } from 'utils/format'
import styles from './RewardsTimingCard.module.css'

const messages = {
  rewardsTiming: 'Rewards Timing',
  currentRound: 'Current Round',
  untilNextRound: 'Until Next Round is Available',
  blocksRemaining: 'Blocks Remaining',
  startNextRound: 'Start Next Round'
}

export const RewardsTimingCard = () => {
  const currentBlockNumber = useEthBlockNumber()
  const { status, claimMetadata } = useClaimMetadata()
  const [currentRound, setCurrentRound] = useState<number | null>(null)

  const getCurrentRound = async () => {
    await window.aud.awaitSetup()
    const round = await window.aud.Claim.getCurrentRound()
    setCurrentRound(round)
  }
  useEffect(() => {
    getCurrentRound()
  }, [])

  const period =
    status === Status.Success
      ? claimMetadata.lastFundedBlock +
        claimMetadata.fundingRoundBlockDiff -
        currentBlockNumber
      : null

  const canInitiateRound =
    status === Status.Success
      ? currentBlockNumber - claimMetadata.lastFundedBlock >
          claimMetadata.fundingRoundBlockDiff &&
        !!window.aud?.Claim?.initiateRound
      : false
  const { timeRemaining } = useTimeRemaining(currentBlockNumber, period)

  return (
    <Card direction="column">
      <Box pv="2xl" ph="xl" borderBottom="default">
        <Text variant="heading" size="s">
          {messages.rewardsTiming}
        </Text>
      </Box>
      <Flex p="l" gap="xl">
        <Card p="xl" direction="column">
          <Box>
            {currentBlockNumber == null ? (
              <Box mb="xs">
                <Loading className={styles.loading} />
              </Box>
            ) : (
              <Text variant="heading" size="s" strength="default">
                {currentRound}
              </Text>
            )}
          </Box>
          <Box>
            <Text variant="body" size="m" strength="strong" color="subdued">
              {messages.currentRound}
            </Text>
          </Box>
        </Card>
        <Card p="xl" css={{ flexGrow: 1 }} justifyContent="space-between">
          <Flex gap="xl">
            <Box>
              {timeRemaining == null ? (
                <Box mb="xs">
                  <Loading className={styles.loading} />
                </Box>
              ) : (
                <Text variant="heading" size="s" strength="default">
                  {getHumanReadableTime(timeRemaining)}
                </Text>
              )}
              <Text variant="body" size="m" strength="strong" color="subdued">
                {messages.untilNextRound}
              </Text>
            </Box>
            <Box>
              {period == null ? (
                <Box mb="xs">
                  <Loading className={styles.loading} />
                </Box>
              ) : (
                <Text variant="heading" size="s" strength="default">
                  {formatNumber(period)}
                </Text>
              )}
              <Text variant="body" size="m" strength="strong" color="subdued">
                {messages.blocksRemaining}
              </Text>
            </Box>
          </Flex>
          <Button
            type={canInitiateRound ? ButtonType.PRIMARY : ButtonType.DISABLED}
            text={messages.startNextRound}
            isDisabled={!canInitiateRound}
            onClick={() => {
              window.aud?.Claim?.initiateRound()
            }}
          />
        </Card>
      </Flex>
    </Card>
  )
}
