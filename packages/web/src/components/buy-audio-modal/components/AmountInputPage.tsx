import { useCallback, useMemo } from 'react'

import { StringKeys } from '@audius/common/services'
import {
  buyAudioActions,
  buyAudioSelectors,
  OnRampProvider
} from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useOnRampProviderInfo } from 'pages/audio-page/components/WalletManagementTile'

import { AudioAmountPicker } from './AudioAmountPicker'
import { CoinbaseBuyAudioButton } from './CoinbaseBuyAudioButton'
import { PurchaseQuote } from './PurchaseQuote'
import { StripeBuyAudioButton } from './StripeBuyAudioButton'

const { calculateAudioPurchaseInfo, setProvider } = buyAudioActions

const messages = {
  intermediateSolNoticeCoinbase:
    'An intermediate purchase of SOL will be made via Coinbase Pay and then converted to $AUDIO.',
  intermediateSolNoticeStripe:
    'An intermediate purchase of SOL will be made via Link by Stripe and then converted to $AUDIO.',
  switchToStripe: 'Switch to Link by Stripe',
  switchToCoinbase: 'Switch to Coinbase Pay'
}

const { getBuyAudioProvider } = buyAudioSelectors

export const AmountInputPage = () => {
  const dispatch = useDispatch()
  const provider = useSelector(getBuyAudioProvider)
  const presetAmountsConfig = useRemoteVar(StringKeys.BUY_AUDIO_PRESET_AMOUNTS)

  const handleAmountChange = useCallback(
    (amount: string) => {
      const audioAmount = parseInt(amount)
      if (!isNaN(audioAmount)) {
        dispatch(
          calculateAudioPurchaseInfo({
            audioAmount
          })
        )
      }
    },
    [dispatch]
  )

  const presetAmounts = useMemo(() => {
    return presetAmountsConfig.split(',').map((amount) => amount.trim())
  }, [presetAmountsConfig])

  const handleSetProvider = useCallback(() => {
    const newProvider =
      provider === OnRampProvider.COINBASE
        ? OnRampProvider.STRIPE
        : OnRampProvider.COINBASE
    dispatch(setProvider({ provider: newProvider }))
  }, [dispatch, provider])

  const onRampProviders = useOnRampProviderInfo()
  const isStripeEnabled = onRampProviders[OnRampProvider.STRIPE].isEnabled
  const isCoinbaseEnabled = onRampProviders[OnRampProvider.COINBASE].isEnabled
  const areMultipleProvidersEnabled = isStripeEnabled && isCoinbaseEnabled

  return (
    <Flex direction='column' gap='xl'>
      <AudioAmountPicker
        presetAmounts={presetAmounts}
        onAmountChanged={handleAmountChange}
      />
      <PurchaseQuote />
      <Flex direction='column' justifyContent='center' gap='l'>
        {provider === OnRampProvider.COINBASE ? (
          <CoinbaseBuyAudioButton />
        ) : (
          <StripeBuyAudioButton />
        )}
        {areMultipleProvidersEnabled ? (
          <Text
            variant='body'
            size='s'
            onClick={handleSetProvider}
            textAlign='center'
            css={(theme) => ({
              color: theme.color.primary.p500,
              cursor: 'pointer'
            })}
          >
            {provider === OnRampProvider.STRIPE
              ? messages.switchToCoinbase
              : messages.switchToStripe}
          </Text>
        ) : null}
      </Flex>
      <Flex
        pv='m'
        ph='4xl'
        borderTop='default'
        css={{ marginLeft: '-24px', marginRight: '-24px' }}
      >
        <Text
          variant='body'
          size='s'
          color='subdued'
          strength='default'
          textAlign='center'
        >
          {provider === OnRampProvider.COINBASE
            ? messages.intermediateSolNoticeCoinbase
            : messages.intermediateSolNoticeStripe}
        </Text>
      </Flex>
    </Flex>
  )
}
