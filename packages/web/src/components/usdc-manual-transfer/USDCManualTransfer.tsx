import { useCallback, useContext } from 'react'

import { Name, useCreateUserbankIfNeeded } from '@audius/common'
import { Button, ButtonType, Flex, IconLogoCircleUSDC } from '@audius/harmony'
import { IconError } from '@audius/stems'
import cn from 'classnames'
import QRCode from 'react-qr-code'
import { useAsync } from 'react-use'

import { Icon } from 'components/Icon'
import { AddressTile } from 'components/address-tile'
import { ToastContext } from 'components/toast/ToastContext'
import { Text } from 'components/typography'
import { Hint } from 'components/withdraw-usdc-modal/components/Hint'
import { track, make } from 'services/analytics'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { getUSDCUserBank } from 'services/solana/solana'
import { isMobile } from 'utils/clientUtil'
import { copyToClipboard } from 'utils/clipboardUtil'

import styles from './USDCManualTransfer.module.css'

const USDCLearnMore =
  'https://support.audius.co/help/Understanding-USDC-on-Audius'

const messages = {
  explainer:
    'Add funds by sending Solana based (SPL) USDC to your Audius account.',
  disclaimer: 'Use caution to avoid errors and lost funds.',
  learnMore: 'Learn More',
  copy: 'Copy Wallet Address',
  goBack: 'Go Back',
  copied: 'Copied to Clipboard!'
}

export const USDCManualTransfer = ({ onClose }: { onClose: () => void }) => {
  useCreateUserbankIfNeeded({
    recordAnalytics: track,
    audiusBackendInstance,
    mint: 'usdc'
  })
  const { toast } = useContext(ToastContext)
  const mobile = isMobile()

  const { value: USDCUserBank } = useAsync(async () => {
    const USDCUserBankPubKey = await getUSDCUserBank()
    return USDCUserBankPubKey?.toString()
  })

  const handleCopy = useCallback(() => {
    copyToClipboard(USDCUserBank ?? '')
    toast(messages.copied)
    track(
      make({
        eventName: Name.PURCHASE_CONTENT_USDC_USER_BANK_COPIED,
        address: USDCUserBank ?? ''
      })
    )
  }, [USDCUserBank, toast])

  return (
    <div className={styles.root}>
      <Flex gap='l' alignItems='center' direction={mobile ? 'column' : 'row'}>
        {mobile ? <Text>{messages.explainer}</Text> : null}
        <div className={styles.qr}>
          {USDCUserBank ? <QRCode value={USDCUserBank} /> : null}
        </div>
        <Flex direction='column' gap='xl'>
          {!mobile ? <Text>{messages.explainer}</Text> : null}
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
          [styles.mobile]: mobile
        })}
      >
        <Button variant={ButtonType.PRIMARY} fullWidth onClick={handleCopy}>
          {messages.copy}
        </Button>
        {mobile ? null : (
          <Button variant={ButtonType.TERTIARY} fullWidth onClick={onClose}>
            {messages.goBack}
          </Button>
        )}
      </div>
    </div>
  )
}
