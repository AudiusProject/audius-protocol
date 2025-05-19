import { useCallback, useMemo } from 'react'

import { useCreateUserbankIfNeeded } from '@audius/common/hooks'
import { Name } from '@audius/common/models'
import Clipboard from '@react-native-clipboard/clipboard'
import QRCode from 'react-qr-code'
import { useAsync } from 'react-use'

import { IconError, Button, Flex, Text, TextLink } from '@audius/harmony-native'
import { useToast } from 'app/hooks/useToast'
import { make, track, track as trackEvent } from 'app/services/analytics'
import { getUSDCUserBank } from 'app/services/buyCrypto'
import { spacing } from 'app/styles/spacing'
import type { AllEvents } from 'app/types/analytics'
import { useThemeColors } from 'app/utils/theme'

import { CashBalanceSection } from '../add-funds-drawer/CashBalanceSection'
import { AddressTile } from '../core/AddressTile'

const USDCLearnMore =
  'https://support.audius.co/help/Understanding-USDC-on-Audius'

const messages = {
  explainer:
    'Add cash to your Audius account by depositing USDC via the Solana network!',
  hint: 'Use caution to avoid errors and lost funds. ',
  copy: 'Copy Wallet Address',
  goBack: 'Go Back',
  learnMore: 'Learn More',
  copied: 'Copied to Clipboard!',
  usdcBalance: 'USDC Balance'
}

type USDCManualTransferProps = {
  amountInCents?: number
}

export const USDCManualTransfer = ({
  amountInCents
}: USDCManualTransferProps) => {
  const { neutral } = useThemeColors()
  const { toast } = useToast()

  useCreateUserbankIfNeeded({
    recordAnalytics: track,
    mint: 'USDC'
  })

  const { value: USDCUserBank } = useAsync(async () => {
    const USDCUserBankPubKey = await getUSDCUserBank()
    return USDCUserBankPubKey?.toString() ?? ''
  })

  const analytics: AllEvents = useMemo(
    () => ({
      eventName: Name.PURCHASE_CONTENT_USDC_USER_BANK_COPIED,
      address: USDCUserBank ?? ''
    }),
    [USDCUserBank]
  )

  const handleConfirmPress = useCallback(() => {
    Clipboard.setString(USDCUserBank ?? '')
    toast({ content: messages.copied, type: 'info' })
    trackEvent(make(analytics))
  }, [USDCUserBank, analytics, toast])

  return (
    <Flex ph='l' gap='xl'>
      <CashBalanceSection />
      <Flex row gap='l' alignItems='center'>
        {USDCUserBank ? <QRCode size={160} value={USDCUserBank} /> : null}
        <Flex flex={1}>
          <Text size='l'>{messages.explainer}</Text>
        </Flex>
      </Flex>
      <AddressTile address={USDCUserBank} analytics={analytics} />
      <Flex
        row
        gap='l'
        alignItems='center'
        ph='l'
        pv='m'
        backgroundColor='surface2'
        border='strong'
        borderRadius='m'
      >
        <IconError width={spacing(6)} height={spacing(6)} fill={neutral} />
        <Flex gap='m' flex={1}>
          <Text>
            {messages.hint}
            <TextLink variant='visible' url={USDCLearnMore}>
              {messages.learnMore}
            </TextLink>
          </Text>
        </Flex>
      </Flex>
      {amountInCents === undefined ? (
        <Button onPress={handleConfirmPress} variant='primary' fullWidth>
          {messages.copy}
        </Button>
      ) : null}
    </Flex>
  )
}
