import { useCallback, useMemo } from 'react'

import {
  Name,
  isContentPurchaseInProgress,
  purchaseContentActions,
  purchaseContentSelectors,
  useCreateUserbankIfNeeded,
  useUSDCBalance,
  useUSDCManualTransferModal
} from '@audius/common'
import { USDC } from '@audius/fixed-decimal'
import Clipboard from '@react-native-clipboard/clipboard'
import BN from 'bn.js'
import { View } from 'react-native'
import QRCode from 'react-qr-code'
import { useDispatch, useSelector } from 'react-redux'
import { useAsync } from 'react-use'

import IconError from 'app/assets/images/iconError.svg'
import LogoUSDC from 'app/assets/images/logoUSDC.svg'
import { Button, Text, useLink } from 'app/components/core'
import Drawer from 'app/components/drawer'
import { useToast } from 'app/hooks/useToast'
import { make, track, track as trackEvent } from 'app/services/analytics'
import { audiusBackendInstance } from 'app/services/audius-backend-instance'
import { getUSDCUserBank } from 'app/services/buyCrypto'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import type { AllEvents } from 'app/types/analytics'
import { useThemeColors } from 'app/utils/theme'

import { AddressTile } from '../core/AddressTile'

const { getPurchaseContentFlowStage, getPurchaseContentError } =
  purchaseContentSelectors
const { startPurchaseContentFlow } = purchaseContentActions

const USDCLearnMore =
  'https://support.audius.co/help/Understanding-USDC-on-Audius'

const messages = {
  title: 'Manual Crypto Transfer',
  explainer:
    'You can add funds manually by transferring USDC tokens to your Audius Wallet.\n\n\n Use caution to avoid errors and lost funds.',
  splOnly: 'You can only send Solana based (SPL) USDC tokens to this address.',
  copy: 'Copy Wallet Address',
  goBack: 'Go Back',
  learnMore: 'Learn More',
  copied: 'Copied to Clipboard!',
  buy: (amount: string) => `Buy ${amount}`
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  drawer: {
    marginVertical: spacing(6),
    marginHorizontal: spacing(4),
    gap: spacing(6)
  },
  titleContainer: {
    ...flexRowCentered(),
    justifyContent: 'center',
    width: '100%',
    paddingBottom: spacing(4),
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8
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
    textAlign: 'center',
    lineHeight: typography.fontSize.medium * 1.25
  },
  splContainer: {
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

export const USDCManualTransferDrawer = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const { isOpen, onClose, onClosed, data } = useUSDCManualTransferModal()
  const { source, amount: amountInCents, startPurchaseParams } = data ?? {}
  const { onPress: onPressLearnMore } = useLink(USDCLearnMore)
  const { neutral, specialLightGreen } = useThemeColors()

  const stage = useSelector(getPurchaseContentFlowStage)
  const error = useSelector(getPurchaseContentError)
  const isUnlocking = !error && isContentPurchaseInProgress(stage)
  const { data: balanceBN } = useUSDCBalance({
    isPolling: true,
    pollingInterval: 1000
  })
  const balance = USDC((balanceBN ?? new BN(0)) as BN).value
  const amount = USDC((amountInCents ?? 0) / 100).value
  const isBuyButtonDisabled = isUnlocking || balance < amount

  useCreateUserbankIfNeeded({
    recordAnalytics: track,
    audiusBackendInstance,
    mint: 'usdc'
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

  const handleBuyPress = useCallback(() => {
    if (startPurchaseParams) {
      dispatch(startPurchaseContentFlow(startPurchaseParams))
    }
    onClose()
  }, [dispatch, onClose, startPurchaseParams])

  return (
    <Drawer isOpen={isOpen} onClose={onClose} onClosed={onClosed}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <Text
            variant='label'
            weight='heavy'
            color='neutralLight2'
            fontSize='xl'
            textTransform='uppercase'
          >
            {messages.title}
          </Text>
        </View>
        <Text style={styles.explainer}>{messages.explainer}</Text>
        <View style={styles.qr}>
          {USDCUserBank ? (
            <QRCode size={160} style={styles.qr} value={USDCUserBank} />
          ) : null}
        </View>
        <AddressTile
          address={USDCUserBank ?? ''}
          left={<LogoUSDC height={spacing(6)} />}
          analytics={analytics}
        />
        <View style={styles.disclaimerContainer}>
          <IconError
            width={spacing(6)}
            height={spacing(6)}
            fill={neutral}
            style={styles.icon}
          />
          <View style={styles.splContainer}>
            <View style={styles.shrink}>
              <Text style={styles.disclaimer}>{messages.splOnly}</Text>
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
          {source === 'add-funds' ? (
            <>
              <Button
                title={messages.copy}
                onPress={handleConfirmPress}
                variant='primary'
                size='large'
                fullWidth
              />
              <Button
                title={messages.goBack}
                onPress={onClose}
                variant='common'
                size='large'
                fullWidth
              />
            </>
          ) : (
            <>
              <Button
                title={messages.goBack}
                onPress={onClose}
                variant='common'
                size='large'
                fullWidth
              />
              <Button
                title={messages.buy(USDC(amount).toFixed(2))}
                onPress={handleBuyPress}
                variant='primary'
                color={specialLightGreen}
                size='large'
                disabled={isBuyButtonDisabled}
                fullWidth
              />
            </>
          )}
        </View>
      </View>
    </Drawer>
  )
}
