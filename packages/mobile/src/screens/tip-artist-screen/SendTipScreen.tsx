import { useCallback, useState } from 'react'

import type { StringWei } from '@audius/common/models'
import {
  tippingSelectors,
  tippingActions,
  walletSelectors,
  walletActions
} from '@audius/common/store'
import { parseAudioInputToWei, stringWeiToBN } from '@audius/common/utils'
import { useFocusEffect } from '@react-navigation/native'
import { Platform } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { IconArrowRight, IconClose, Button } from '@audius/harmony-native'
import { ErrorText } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { TopBarIconButton } from '../app-screen'

import { AvailableAudio } from './AvailableAudio'
import { DegradationNotice } from './DegradationNotice'
import { ReceiverDetails } from './ReceiverDetails'
import { SupporterPrompt } from './SupporterPrompt'
import { TipInput } from './TipInput'
import { TipScreen } from './TipScreen'
import type { TipArtistNavigationParamList } from './navigation'

const { getBalance } = walletActions
const { getAccountBalance } = walletSelectors
const { sendTip } = tippingActions
const { getSendUser } = tippingSelectors

const messages = {
  sendTip: 'Send Tip',
  // NOTE: Send tip -> Send $AUDIO change
  sendAudio: 'Send $AUDIO', // iOS only
  insufficientBalance: 'Insufficient Balance'
}

const useStyles = makeStyles(({ spacing }) => ({
  sendButton: {
    marginBottom: spacing(6)
  }
}))

const zeroWei = stringWeiToBN('0' as StringWei)

export const SendTipScreen = () => {
  const styles = useStyles()
  const [tipAmount, setTipAmount] = useState('')
  const accountBalance = useSelector(getAccountBalance) ?? zeroWei
  const navigation = useNavigation<TipArtistNavigationParamList>()
  const dispatch = useDispatch()

  const receiver = useSelector(getSendUser)

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleSendTip = useCallback(() => {
    dispatch(sendTip({ amount: tipAmount }))
    navigation.navigate('ConfirmTip')
  }, [dispatch, tipAmount, navigation])

  useFocusEffect(
    useCallback(() => {
      dispatch(getBalance())
    }, [dispatch])
  )

  const tipAmountWei = parseAudioInputToWei(tipAmount)
  const hasInsufficientBalance = tipAmountWei?.gt(accountBalance)

  return (
    <TipScreen
      title={Platform.OS === 'ios' ? messages.sendAudio : messages.sendTip}
      topbarLeft={<TopBarIconButton icon={IconClose} onPress={handleBack} />}
    >
      <DegradationNotice />
      <ReceiverDetails />
      <SupporterPrompt receiverId={receiver?.user_id} />
      <TipInput value={tipAmount} onChangeText={setTipAmount} />
      <AvailableAudio />
      <Button
        variant='primary'
        onPress={handleSendTip}
        iconRight={IconArrowRight}
        fullWidth
        disabled={
          !tipAmount || tipAmountWei?.lte(zeroWei) || hasInsufficientBalance
        }
        style={styles.sendButton}
      >
        {Platform.OS === 'ios' ? messages.sendAudio : messages.sendTip}
      </Button>
      {hasInsufficientBalance ? (
        <ErrorText>{messages.insufficientBalance}</ErrorText>
      ) : null}
    </TipScreen>
  )
}
