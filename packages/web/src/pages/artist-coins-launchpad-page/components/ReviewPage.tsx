import { useEffect, useState } from 'react'

import {
  Artwork,
  Flex,
  Paper,
  Text,
  makeResponsiveStyles
} from '@audius/harmony'
import { useFormikContext } from 'formik'

import { AMOUNT_OF_STEPS } from '../constants'

import { ArtistCoinsAnchoredSubmitRow } from './ArtistCoinsAnchoredSubmitRow'
import { StepHeader } from './StepHeader'
import { TokenInfoRow } from './TokenInfoRow'
import type { ReviewPageProps, SetupFormValues } from './types'

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
  back: 'Back'
}

const coinDetails = {
  initialPrice: '~$0.000415',
  totalSupply: '1,000,000,000',
  initialMarketCap: '10,000 $AUDIO',
  graduationMarketCap: '500,000 $AUDIO',
  allocation: '50%',
  vesting: '5 years (Linear)',
  tradingFees: '50%'
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

export const ReviewPage = ({ onContinue, onBack }: ReviewPageProps) => {
  const { values } = useFormikContext<SetupFormValues>()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const styles = useStyles()

  useEffect(() => {
    if (values.coinImage) {
      const url = URL.createObjectURL(values.coinImage)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [values.coinImage])

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
        pb='unit20'
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
            css={(theme) => ({
              border: `1px solid ${theme.color.border.default}`,
              borderRadius: theme.cornerRadius.m,
              overflow: 'hidden'
            })}
          >
            {/* Token Info Header */}
            <Flex
              alignItems='center'
              gap='m'
              p='l'
              css={(theme) => ({
                backgroundColor: theme.color.background.white,
                borderBottom: `1px solid ${theme.color.border.default}`
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
                  />
                  <TokenInfoRow
                    label={messages.initialMarketCap}
                    value={coinDetails.initialMarketCap}
                    hasTooltip
                  />
                  <TokenInfoRow
                    label={messages.graduationMarketCap}
                    value={coinDetails.graduationMarketCap}
                    hasTooltip
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
                  />
                  <TokenInfoRow
                    label={messages.vesting}
                    value={coinDetails.vesting}
                    hasTooltip
                  />
                  <TokenInfoRow
                    label={messages.tradingFees}
                    value={coinDetails.tradingFees}
                    hasTooltip
                  />
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Paper>
      </Flex>
      <ArtistCoinsAnchoredSubmitRow
        cancelText={messages.back}
        backIcon
        onContinue={handleContinue}
        onBack={handleBack}
      />
    </>
  )
}
