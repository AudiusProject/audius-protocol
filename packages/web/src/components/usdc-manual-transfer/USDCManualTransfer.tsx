import { useCallback, useContext } from 'react'

import {
  Name,
  isContentPurchaseInProgress,
  purchaseContentSelectors
} from '@audius/common'
import { useUSDCBalance, useCreateUserbankIfNeeded } from '@audius/common/hooks'
import { USDC } from '@audius/fixed-decimal'
import { Button, Flex, IconLogoCircleUSDC } from '@audius/harmony'
import { IconError } from '@audius/stems'
import BN from 'bn.js'
import cn from 'classnames'
import QRCode from 'react-qr-code'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import { Icon } from 'components/Icon'
import { AddressTile } from 'components/address-tile'
import { ToastContext } from 'components/toast/ToastContext'
import { Text } from 'components/typography'
import { Hint } from 'components/withdraw-usdc-modal/components/Hint'
import { useIsMobile } from 'hooks/useIsMobile'
import { track as trackAnalytics, make } from 'services/analytics'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { getUSDCUserBank } from 'services/solana/solana'
import { copyToClipboard } from 'utils/clipboardUtil'

import styles from './USDCManualTransfer.module.css'

const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors

const USDCLearnMore =
  'https://support.audius.co/help/Understanding-USDC-on-Audius'

const messages = {
  explainer:
    'Add funds by sending Solana based (SPL) USDC to your Audius account.',
  disclaimer: 'Use caution to avoid errors and lost funds.',
  learnMore: 'Learn More',
  copy: 'Copy Wallet Address',
  goBack: 'Go Back',
  copied: 'Copied to Clipboard!',
  buy: (amount: string) => `Buy $${amount}`
}

export const USDCManualTransfer = ({
  onClose,
  amountInCents
}: {
  onClose: () => void
  amountInCents?: number
}) => {
  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const { data: balanceBN } = useUSDCBalance()
  const balance = USDC(balanceBN ?? new BN(0)).value
  const amount = USDC((amountInCents ?? 0) / 100).value
  const isBuyButtonDisabled = isUnlocking || balance < amount

  useCreateUserbankIfNeeded({
    recordAnalytics: trackAnalytics,
    audiusBackendInstance,
    mint: 'usdc'
  })
  const { toast } = useContext(ToastContext)
  const isMobile = useIsMobile()

  const { value: USDCUserBank } = useAsync(async () => {
    const USDCUserBankPubKey = await getUSDCUserBank()
    return USDCUserBankPubKey?.toString()
  })

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

  return (
    <Flex direction='column' gap='xl' p='xl'>
      <Flex gap='l' alignItems='center' direction={isMobile ? 'column' : 'row'}>
        {isMobile ? <Text>{messages.explainer}</Text> : null}
        <div className={styles.qr}>
          {USDCUserBank ? <QRCode value={USDCUserBank} /> : null}
        </div>
        <Flex direction='column' gap='xl'>
          {!isMobile ? <Text>{messages.explainer}</Text> : null}
          <Hint
            text={messages.disclaimer}
            link={USDCLearnMore}
            icon={() => <Icon icon={IconError} size='large' fill='neutral' />}
            linkText={messages.learnMore}
          />
        </Flex>
      </Flex>
      <AddressTile address={USDCUserBank ?? ''} iconLeft={IconLogoCircleUSDC} />
      <div
        className={cn(styles.buttonContainer, {
          [styles.mobile]: isMobile
        })}
      >
        {amountInCents === undefined ? (
          <>
            <Button variant='primary' fullWidth onClick={handleCopy}>
              {messages.copy}
            </Button>
            {isMobile ? null : (
              <Button variant='tertiary' fullWidth onClick={onClose}>
                {messages.goBack}
              </Button>
            )}
          </>
        ) : (
          <>
            {isMobile ? null : (
              <Button variant='secondary' fullWidth onClick={onClose}>
                {messages.goBack}
              </Button>
            )}
            <Button
              variant='primary'
              fullWidth
              color='lightGreen'
              disabled={isBuyButtonDisabled}
              type='submit'
            >
              {messages.buy(
                USDC(amount).toLocaleString('en-us', {
                  roundingMode: 'ceil',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })
              )}
            </Button>
          </>
        )}
      </div>
    </Flex>
  )
}
