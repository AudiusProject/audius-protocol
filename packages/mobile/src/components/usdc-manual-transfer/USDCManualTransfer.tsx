import { useCallback, useMemo } from 'react'

import { useUSDCBalance, useCreateUserbankIfNeeded } from '@audius/common/hooks'
import { Name } from '@audius/common/models'
import { USDC } from '@audius/fixed-decimal'
import Clipboard from '@react-native-clipboard/clipboard'
import BN from 'bn.js'
import { View } from 'react-native'
import QRCode from 'react-qr-code'
import { useAsync } from 'react-use'

import { IconError, Button } from '@audius/harmony-native'
import LogoUSDC from 'app/assets/images/logoUSDC.svg'
import { Text, useLink } from 'app/components/core'
import { useToast } from 'app/hooks/useToast'
import { make, track, track as trackEvent } from 'app/services/analytics'
import { getUSDCUserBank } from 'app/services/buyCrypto'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import type { AllEvents } from 'app/types/analytics'
import { useThemeColors } from 'app/utils/theme'

import { AddressTile } from '../core/AddressTile'

const USDCLearnMore =
  'https://support.audius.co/help/Understanding-USDC-on-Audius'

const messages = {
  explainer:
    'Add funds by sending Solana based (SPL) USDC to your Audius account.',
  hint: 'Use caution to avoid errors and lost funds.',
  copy: 'Copy Wallet Address',
  goBack: 'Go Back',
  learnMore: 'Learn More',
  copied: 'Copied to Clipboard!',
  usdcBalance: 'USDC Balance'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    paddingHorizontal: spacing(4),
    gap: spacing(6)
  },
  disclaimerContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'row',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    backgroundColor: palette.backgroundSurface2,
    borderColor: palette.borderStrong,
    borderWidth: 1,
    borderRadius: spacing(2),
    gap: spacing(4)
  },
  disclaimer: {
    lineHeight: typography.fontSize.medium * 1.25
  },
  icon: {
    marginTop: spacing(2)
  },
  buttonContainer: {
    gap: spacing(2)
  },
  learnMore: {
    textDecorationLine: 'underline'
  },
  explainer: {
    textAlign: 'left',
    lineHeight: typography.fontSize.medium * 1.25
  },
  hintContainer: {
    gap: spacing(3),
    flexShrink: 1
  },
  shrink: {
    flexShrink: 1
  },
  qr: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  }
}))

export const USDCManualTransfer = ({
  onClose,
  amountInCents
}: {
  onClose: () => void
  amountInCents?: number
}) => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const { toast } = useToast()

  const { onPress: onPressLearnMore } = useLink(USDCLearnMore)
  const { data: balanceBN } = useUSDCBalance()

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

  const handleLearnMorePress = useCallback(() => {
    onPressLearnMore()
  }, [onPressLearnMore])

  return (
    <View style={styles.root}>
      <Text style={styles.explainer}>{messages.explainer}</Text>
      <View style={styles.qr}>
        {USDCUserBank ? (
          <QRCode size={160} style={styles.qr} value={USDCUserBank} />
        ) : null}
      </View>
      <AddressTile
        title={messages.usdcBalance}
        address={USDCUserBank ?? ''}
        left={<LogoUSDC height={spacing(6)} />}
        analytics={analytics}
        balance={USDC(balanceBN ?? new BN(0)).toLocaleString('en-US', {
          roundingMode: 'floor',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      />
      <View style={styles.disclaimerContainer}>
        <IconError
          width={spacing(6)}
          height={spacing(6)}
          fill={neutral}
          style={styles.icon}
        />
        <View style={styles.hintContainer}>
          <View style={styles.shrink}>
            <Text style={styles.disclaimer}>{messages.hint}</Text>
          </View>
          <Text
            style={styles.learnMore}
            color='primary'
            onPress={handleLearnMorePress}
          >
            {messages.learnMore}
          </Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        {amountInCents === undefined ? (
          <>
            <Button onPress={handleConfirmPress} variant='primary' fullWidth>
              {messages.copy}
            </Button>
            <Button onPress={onClose} variant='secondary' fullWidth>
              {messages.goBack}
            </Button>
          </>
        ) : null}
      </View>
    </View>
  )
}
