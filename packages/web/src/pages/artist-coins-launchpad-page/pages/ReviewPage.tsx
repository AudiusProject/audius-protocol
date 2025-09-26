import {
  Artwork,
  Flex,
  Hint,
  IconInfo,
  Paper,
  Text,
  makeResponsiveStyles
} from '@audius/harmony'
import { useFormikContext } from 'formik'

import { useFormImageUrl } from 'hooks/useFormImageUrl'

import { ArtistCoinsSubmitRow } from '../components/ArtistCoinsSubmitRow'
import { StepHeader } from '../components/StepHeader'
import { TokenInfoRow } from '../components/TokenInfoRow'
import type { PhasePageProps, LaunchpadFormValues } from '../components/types'
import { AMOUNT_OF_STEPS } from '../constants'

const messages = {
  stepInfo: `STEP 2 of ${AMOUNT_OF_STEPS}`,
  title: 'Review Your Coin',
  description: 'Make sure everything looks correct before creating your coin.',
  initialPrice: 'INITIAL PRICE',
  coinDetails: 'Coin Details',
  yourOwnership: 'Your Ownership',
  totalSupply: 'Total Supply',
  initialMarketCap: 'Initial Market Cap',
  graduationMarketCap: 'Graduation Market Cap',
  allocation: 'Allocation',
  vesting: 'Vesting',
  tradingFees: 'Trading Fees',
  back: 'Back',
  hintMessage:
    "Remember! This is your one and only coin and its details can't be changed later."
}

const coinDetails = {
  initialPrice: '~$0.0₄415',
  totalSupply: '1,000,000,000',
  initialMarketCap: {
    usd: '(~$612)',
    audio: '10K $AUDIO'
  },
  graduationMarketCap: {
    usd: '(~$30.6K)',
    audio: '1M $AUDIO'
  },
  allocation: '50%',
  vesting: '5 years (Linear)',
  tradingFees: '50%'
}

const tooltipContent = {
  totalSupply:
    'The total number of your artist coins that will ever exist. This amount is fixed and never changes.',
  initialMarketCap:
    'The starting value of your coin at launch, based on the initial supply made available for trading.',
  graduationMarketCap:
    'The market cap your coin will reach once all vesting and distribution milestones are complete.',
  allocation:
    "The percentage of your total coin supply reserved for you as the creator. You'll receive this gradually through vesting.",
  vesting:
    'Your reserved coins are unlocked over time, following this schedule.',
  tradingFees:
    "The percentage of every trade that you'll earn as revenue. Fees are automatically deposited to your connected wallet."
}

const useStyles = makeResponsiveStyles(({ theme }) => ({
  tableContainer: {
    base: {
      flexDirection: 'row',
      transition: `all ${theme.motion.expressive}`
    },
    tablet: {
      flexDirection: 'column'
    }
  },
  column: {
    base: {
      backgroundColor: theme.color.background.white,
      borderRight: `1px solid ${theme.color.border.default}`,
      borderBottom: 'none',
      transition: `all ${theme.motion.expressive}`,
      flex: '1 1 50%',
      minHeight: theme.spacing['4xl']
    },
    tablet: {
      backgroundColor: theme.color.background.white,
      borderRight: 'none',
      borderBottom: `1px solid ${theme.color.border.default}`,
      flex: '1 1 100%',
      minHeight: theme.spacing['4xl']
    }
  }
}))

export const ReviewPage = ({ onContinue, onBack }: PhasePageProps) => {
  const { values } = useFormikContext<LaunchpadFormValues>()
  const imageUrl = useFormImageUrl(values.coinImage)
  const styles = useStyles()

  const handleBack = () => {
    onBack?.()
  }

  const handleContinue = () => {
    onContinue?.()
  }

  return (
    <>
      <Flex
        direction='column'
        alignItems='center'
        justifyContent='center'
        gap='l'
      >
        <Paper p='2xl' gap='2xl' direction='column' w='100%'>
          <StepHeader
            stepInfo={messages.stepInfo}
            title={messages.title}
            description={messages.description}
          />

          <Flex
            p='0'
            direction='column'
            w='100%'
            border='default'
            borderRadius='m'
            css={{ overflow: 'hidden' }}
          >
            {/* Token Info Header */}
            <Flex
              alignItems='center'
              gap='m'
              p='l'
              borderBottom='default'
              css={(theme) => ({
                backgroundColor: theme.color.background.white
              })}
            >
              {imageUrl && (
                <Artwork
                  src={imageUrl}
                  hex={true}
                  w='4xl'
                  h='4xl'
                  borderWidth={0}
                />
              )}
              <Flex direction='column' gap='xs' flex='1'>
                <Text variant='heading' size='s' color='default'>
                  {values.coinName}
                </Text>
                <Text
                  variant='body'
                  size='l'
                  color='subdued'
                  textTransform='uppercase'
                >
                  ${values.coinSymbol}
                </Text>
              </Flex>
              <Flex direction='column' gap='xs' alignItems='flex-end'>
                <Text variant='label' size='m'>
                  {messages.initialPrice}
                </Text>
                <Text variant='body' size='l' color='subdued'>
                  {coinDetails.initialPrice}
                </Text>
              </Flex>
            </Flex>

            {/* Token Details Section */}
            <Flex css={styles.tableContainer}>
              {/* Coin Details Column */}
              <Flex
                direction='column'
                gap='l'
                p='l'
                flex='1'
                css={styles.column}
              >
                <Text variant='heading' size='s' color='default'>
                  {messages.coinDetails}
                </Text>
                <Flex direction='column' gap='m'>
                  <TokenInfoRow
                    label={messages.totalSupply}
                    value={coinDetails.totalSupply}
                    hasTooltip
                    tooltipContent={tooltipContent.totalSupply}
                  />
                  <TokenInfoRow
                    label={messages.initialMarketCap}
                    value={
                      <Flex gap='s' alignItems='center'>
                        <Text variant='body' size='m' color='subdued'>
                          {coinDetails.initialMarketCap.usd}
                        </Text>
                        <Text variant='body' size='m' color='default'>
                          {coinDetails.initialMarketCap.audio}
                        </Text>
                      </Flex>
                    }
                    hasTooltip
                    tooltipContent={tooltipContent.initialMarketCap}
                  />
                  <TokenInfoRow
                    label={messages.graduationMarketCap}
                    value={
                      <Flex gap='s' alignItems='center'>
                        <Text variant='body' size='m' color='subdued'>
                          {coinDetails.graduationMarketCap.usd}
                        </Text>
                        <Text variant='body' size='m' color='default'>
                          {coinDetails.graduationMarketCap.audio}
                        </Text>
                      </Flex>
                    }
                    hasTooltip
                    tooltipContent={tooltipContent.graduationMarketCap}
                  />
                </Flex>
              </Flex>

              {/* Your Ownership Column */}
              <Flex
                direction='column'
                gap='l'
                p='l'
                flex='1'
                css={styles.column}
              >
                <Text variant='heading' size='s' color='default'>
                  {messages.yourOwnership}
                </Text>
                <Flex direction='column' gap='m'>
                  <TokenInfoRow
                    label={messages.allocation}
                    value={coinDetails.allocation}
                    hasTooltip
                    tooltipContent={tooltipContent.allocation}
                  />
                  <TokenInfoRow
                    label={messages.vesting}
                    value={coinDetails.vesting}
                    hasTooltip
                    tooltipContent={tooltipContent.vesting}
                  />
                  <TokenInfoRow
                    label={messages.tradingFees}
                    value={coinDetails.tradingFees}
                    hasTooltip
                    tooltipContent={tooltipContent.tradingFees}
                  />
                </Flex>
              </Flex>
            </Flex>
          </Flex>
          <Hint icon={IconInfo}>{messages.hintMessage}</Hint>
        </Paper>
      </Flex>
      <ArtistCoinsSubmitRow
        cancelText={messages.back}
        backIcon
        onContinue={handleContinue}
        isValid={true} // There are no form fields changing on this page - no need to check validation here
        onBack={handleBack}
      />
    </>
  )
}
