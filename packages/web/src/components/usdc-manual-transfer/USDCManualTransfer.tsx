import { useCallback, useContext } from 'react'

import { useWalletAddresses, useUSDCBalance } from '@audius/common/api'
import { useCreateUserbankIfNeeded } from '@audius/common/hooks'
import { Name } from '@audius/common/models'
import {
  purchaseContentSelectors,
  isContentPurchaseInProgress
} from '@audius/common/store'
import { USDC } from '@audius/fixed-decimal'
import {
  Button,
  Flex,
  IconError,
  Text,
  LoadingSpinner,
  Divider,
  Hint
} from '@audius/harmony'
import BN from 'bn.js'
import QRCode from 'react-qr-code'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { CashBalanceSection } from 'components/add-cash/CashBalanceSection'
import { AddressTile } from 'components/address-tile'
import { ExternalLink } from 'components/link/ExternalLink'
import { ToastContext } from 'components/toast/ToastContext'
import { useIsMobile } from 'hooks/useIsMobile'
import { track as trackAnalytics, make } from 'services/analytics'
import { getUSDCUserBank } from 'services/solana/solana'
import { copyToClipboard } from 'utils/clipboardUtil'

const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

const USDCLearnMore = 'https://support.audius.co/product/usdc'
const DIMENSIONS = 160

const messages = {
  explainer:
    'Add cash to your Audius account by depositing USDC via the Solana network!',
  disclaimer: 'Use caution to avoid errors and lost funds.',
  learnMore: 'Learn More',
  copy: 'Copy Wallet Address',
  close: 'Close',
  copied: 'Copied to Clipboard!',
  buy: (amount: string) => `Buy ${amount}`
}

export const USDCManualTransfer = ({
  onClose,
  amountInCents,
  onPurchase
}: {
  onClose: () => void
  amountInCents?: number
  onPurchase?: () => void
}) => {
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const { data: walletAddresses } = useWalletAddresses()
  const { currentUser: wallet } = walletAddresses ?? {}
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const { data: balanceBN } = useUSDCBalance({
    isPolling: true
  })
  const balance = USDC(balanceBN ?? new BN(0)).value
  const amount = USDC((amountInCents ?? 0) / 100).value
  const isBuyButtonDisabled = isUnlocking || balance < amount

  useCreateUserbankIfNeeded({
    recordAnalytics: trackAnalytics,
    mint: 'USDC'
  })
  const { toast } = useContext(ToastContext)
  const isMobile = useIsMobile()

  const { value: USDCUserBank } = useAsync(async () => {
    if (wallet) {
      const USDCUserBankPubKey = await getUSDCUserBank(wallet)
      return USDCUserBankPubKey?.toString()
    }
  }, [wallet])

  const handleCopy = useCallback(() => {
    copyToClipboard(USDCUserBank ?? '')
    toast(messages.copied)
    trackAnalytics(
      make({
        eventName: Name.PURCHASE_CONTENT_USDC_USER_BANK_COPIED,
        address: USDCUserBank ?? ''
      })
    )
  }, [USDCUserBank, toast])

  return wallet === null ? (
    <Flex justifyContent='center' alignItems='center' p='xl' w='100%'>
      <LoadingSpinner css={{ height: 32 }} />
    </Flex>
  ) : (
    <Flex direction='column' gap='xl' p='xl' h='100%'>
      <CashBalanceSection />
      <Divider orientation='horizontal' color='default' />
      <Flex
        gap='xl'
        alignItems='center'
        direction={isMobile ? 'column' : 'row'}
      >
        {isMobile ? <Text>{messages.explainer}</Text> : null}
        <Flex
          w={DIMENSIONS}
          h={DIMENSIONS}
          alignItems='center'
          justifyContent='center'
        >
          {USDCUserBank ? <QRCode value={USDCUserBank} /> : null}
        </Flex>
        <Flex column gap='xl' h={DIMENSIONS} justifyContent='space-between'>
          {!isMobile ? (
            <Text variant='body' size='l'>
              {messages.explainer}
            </Text>
          ) : null}
          <Hint icon={IconError}>
            <Flex column>
              <Text variant='body'>{messages.disclaimer}</Text>
              <ExternalLink to={USDCLearnMore}>
                <Text variant='body' color='link'>
                  {messages.learnMore}
                </Text>
              </ExternalLink>
            </Flex>
          </Hint>
        </Flex>
      </Flex>
      <AddressTile address={USDCUserBank} />
      <Flex gap='s' alignItems='center' direction={isMobile ? 'column' : 'row'}>
        {amountInCents === undefined ? (
          <>
            <Button variant='primary' fullWidth onClick={handleCopy}>
              {messages.copy}
            </Button>
            {isMobile ? null : (
              <Button variant='secondary' fullWidth onClick={onClose}>
                {messages.close}
              </Button>
            )}
          </>
        ) : (
          <>
            {isMobile ? null : (
              <Button variant='secondary' fullWidth onClick={onClose}>
                {messages.close}
              </Button>
            )}
            <Button
              variant='primary'
              fullWidth
              color='lightGreen'
              disabled={isBuyButtonDisabled}
              type='submit'
              onClick={onPurchase}
            >
              {messages.buy(
                USDC(amount).toLocaleString('en-us', {
                  roundingMode: 'ceil'
                })
              )}
            </Button>
          </>
        )}
      </Flex>
    </Flex>
  )
}
