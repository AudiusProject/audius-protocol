import { useCallback, useContext } from 'react'

import { useFeatureFlag, useIsManagedAccount } from '@audius/common/hooks'
import { buySellMessages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import { useBuySellModal } from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  Button,
  Flex,
  Paper,
  Text,
  useMedia,
  useTheme,
  Divider,
  IconCaretRight
} from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { push } from 'redux-first-history'

import { ToastContext } from 'components/toast/ToastContext'

import { AudioCoinCard } from './AudioCoinCard'
import { BonkCoinCard } from './BonkCoinCard'

const messages = {
  ...buySellMessages,
  managedAccount: "You can't do that as a managed user",
  findMoreCoins: 'Find More Coins',
  exploreArtistCoins: 'Explore available artist coins on Audius.',
  bonkTicker: '$BONK'
}

const { WALLET_AUDIO_PAGE } = route

const YourCoinsHeader = () => {
  const { onOpen: openBuySellModal } = useBuySellModal()
  const isManagedAccount = useIsManagedAccount()
  const { toast } = useContext(ToastContext)

  const handleBuySellClick = useCallback(() => {
    if (isManagedAccount) {
      toast(messages.managedAccount)
    } else {
      openBuySellModal()
    }
  }, [isManagedAccount, openBuySellModal, toast])

  return (
    <Flex
      alignItems='center'
      justifyContent='space-between'
      p='l'
      borderBottom='default'
    >
      <Text variant='heading' size='m' color='heading'>
        {messages.yourCoins}
      </Text>
      <Button variant='secondary' size='small' onClick={handleBuySellClick}>
        {messages.buySell}
      </Button>
    </Flex>
  )
}

export const YourCoins = () => {
  const dispatch = useDispatch()
  const { color, spacing } = useTheme()
  const { isMobile } = useMedia()
  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )
  const { isEnabled: isWalletUIBuySellEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_BUY_SELL
  )

  const handleTokenClick = useCallback(() => {
    dispatch(push(WALLET_AUDIO_PAGE))
  }, [dispatch])

  return (
    <Paper column shadow='far' borderRadius='l' css={{ overflow: 'hidden' }}>
      {isWalletUIBuySellEnabled ? <YourCoinsHeader /> : null}
      <Flex
        alignItems='center'
        justifyContent='space-between'
        p={isMobile ? spacing.l : undefined}
        alignSelf='stretch'
      >
        <AudioCoinCard onClick={handleTokenClick} />
        {isArtistCoinsEnabled ? (
          <>
            <Divider orientation='vertical' />
            <BonkCoinCard onClick={handleTokenClick} />
          </>
        ) : null}
      </Flex>
      <Flex
        p={isMobile ? spacing.l : spacing.xl}
        css={{
          cursor: 'pointer',
          '&:hover': { backgroundColor: color.background.surface2 }
        }}
      >
        <Flex flex={1} alignItems='center' justifyContent='space-between'>
          <Flex column gap='xs'>
            <Text variant='heading' size='m' color='default'>
              {messages.findMoreCoins}
            </Text>
            <Text color='subdued'>{messages.exploreArtistCoins}</Text>
          </Flex>
          <IconCaretRight size='l' color='subdued' />
        </Flex>
      </Flex>
    </Paper>
  )
}
