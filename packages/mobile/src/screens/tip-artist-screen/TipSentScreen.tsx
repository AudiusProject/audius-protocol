import { useCallback } from 'react'

import { useCurrentAccountUser } from '@audius/common/api'
import type { SolanaWalletAddress } from '@audius/common/models'
import { tippingSelectors } from '@audius/common/store'
import { formatNumberCommas } from '@audius/common/utils'
import { useNavigation } from '@react-navigation/native'
import { Platform } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { IconCheck, IconClose, PlainButton } from '@audius/harmony-native'
import { TwitterButton } from 'app/components/twitter-button'
import { env } from 'app/services/env'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'

import { TopBarIconButton } from '../app-screen'

import { DescriptionText } from './DescriptionText'
import { ReceiverDetails } from './ReceiverDetails'
import { TipHeader } from './TipHeader'
import { TipScreen } from './TipScreen'
const { getSendTipData } = tippingSelectors

const messages = {
  title: 'Tip Sent',
  // NOTE: Send tip -> Send $AUDIO change
  titleAlt: '$AUDIO Sent', // iOS only
  description: 'Share your support on Twitter!',
  done: 'Done',
  twitterCopyPrefix: 'I just tipped ',
  twitterCopyPrefixAlt: 'I just sent ', // iOS only
  twitterCopySuffix: ' $AUDIO on @audius #Audius #AUDIOTip',
  twitterCopySuffixAlt: ' $AUDIO on @audius #Audius #AUDIO' // iOS only
}

const useStyles = makeStyles(({ spacing }) => ({
  twitter: {
    marginBottom: spacing(6)
  },
  close: {
    alignSelf: 'center'
  },
  button: {
    alignSelf: 'center'
  }
}))

export const TipSentScreen = () => {
  const dispatch = useDispatch()
  const { data: { user_id, handle, spl_wallet } = {} } = useCurrentAccountUser({
    select: (user) => ({
      user_id: user?.user_id,
      handle: user?.handle,
      spl_wallet: user?.spl_wallet
    })
  })
  const {
    user: recipient,
    amount: sendAmount,
    source,
    onSuccessActions
  } = useSelector(getSendTipData)
  const styles = useStyles()
  const navigation = useNavigation()

  const getTwitterShareText = () => {
    const formattedSendAmount = formatNumberCommas(sendAmount)
    if (user_id && recipient) {
      let recipientAndAmount = `${recipient.name} ${formattedSendAmount}`
      if (recipient.twitter_handle) {
        recipientAndAmount = `@${recipient.twitter_handle} ${formattedSendAmount}`
      }
      return `${
        Platform.OS === 'ios'
          ? messages.twitterCopyPrefixAlt
          : messages.twitterCopyPrefix
      }${recipientAndAmount}${
        Platform.OS === 'ios'
          ? messages.twitterCopySuffixAlt
          : messages.twitterCopySuffix
      }`
    }
    return ''
  }

  const handleClose = useCallback(() => {
    // After success + close, take the user to the chat they were
    // attempting to make if they were unlocking DMs by tipping.
    // The saga will create the chat once the tip is confirmed
    if (onSuccessActions && user_id && recipient?.user_id) {
      for (const action of onSuccessActions) {
        dispatch(action)
      }
    } else {
      navigation.getParent()?.goBack()
    }
  }, [user_id, dispatch, onSuccessActions, navigation, recipient?.user_id])

  return (
    <TipScreen
      title={Platform.OS === 'ios' ? messages.titleAlt : messages.title}
      topbarLeft={<TopBarIconButton icon={IconClose} onPress={handleClose} />}
    >
      <TipHeader status='sent' />
      <ReceiverDetails />
      <DescriptionText>{messages.description}</DescriptionText>
      <TwitterButton
        type='static'
        fullWidth
        style={styles.twitter}
        shareText={getTwitterShareText()}
        url={recipient ? `${env.AUDIUS_URL}/${recipient.handle}` : undefined}
        analytics={
          user_id && recipient
            ? {
                eventName: EventNames.TIP_AUDIO_TWITTER_SHARE,
                senderWallet: spl_wallet ?? ('' as SolanaWalletAddress),
                recipientWallet:
                  recipient.spl_wallet ?? ('' as SolanaWalletAddress),
                senderHandle: handle ?? 'unknown_handle',
                recipientHandle: recipient.handle,
                amount: sendAmount,
                device: 'native',
                source
              }
            : undefined
        }
      />
      <PlainButton
        variant='subdued'
        iconLeft={IconCheck}
        style={styles.button}
        onPress={handleClose}
      >
        {messages.done}
      </PlainButton>
    </TipScreen>
  )
}
