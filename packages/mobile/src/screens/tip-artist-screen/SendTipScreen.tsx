import { useCallback, useEffect, useState } from 'react'

import {
  accountSelectors,
  tippingSelectors,
  tippingActions,
  walletSelectors,
  walletActions
} from '@audius/common'
import { useGetFirstOrTopSupporter } from '@audius/common/hooks'
import type { StringWei, BNWei } from '@audius/common/models'
import { stringWeiToBN } from '@audius/common/utils'
import { useFocusEffect } from '@react-navigation/native'
import BN from 'bn.js'
import { Platform } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconArrow from 'app/assets/images/iconArrow.svg'
import IconRemove from 'app/assets/images/iconRemove.svg'
import { Button, ErrorText } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { TopBarIconButton } from '../app-screen'

import { AvailableAudio } from './AvailableAudio'
import { BecomeFirstSupporter } from './BecomeFirstSupporter'
import { BecomeTopSupporter } from './BecomeTopSupporter'
import { DegradationNotice } from './DegradationNotice'
import { ReceiverDetails } from './ReceiverDetails'
import { TipInput } from './TipInput'
import { TipScreen } from './TipScreen'
import type { TipArtistNavigationParamList } from './navigation'
const { getBalance } = walletActions
const { getAccountBalance } = walletSelectors
const { sendTip, fetchUserSupporter, refreshSupport } = tippingActions
const { getOptimisticSupporters, getOptimisticSupporting, getSendUser } =
  tippingSelectors
const getAccountUser = accountSelectors.getAccountUser

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
  const accountBalance = (useSelector(getAccountBalance) ??
    new BN('0')) as BNWei
  const navigation = useNavigation<TipArtistNavigationParamList>()
  const dispatch = useDispatch()

  const account = useSelector(getAccountUser)
  const supportersMap = useSelector(getOptimisticSupporters)
  const supportingMap = useSelector(getOptimisticSupporting)
  const receiver = useSelector(getSendUser)

  const {
    amountToTipToBecomeTopSupporter,
    shouldFetchUserSupporter,
    shouldFetchSupportersForReceiver,
    isFirstSupporter,
    tipAmountWei,
    hasInsufficientBalance
  } = useGetFirstOrTopSupporter({
    tipAmount,
    accountBalance,
    account,
    receiver,
    supportingMap,
    supportersMap
  })

  useEffect(() => {
    if (shouldFetchUserSupporter && account && receiver) {
      dispatch(
        fetchUserSupporter({
          currentUserId: account.user_id,
          userId: receiver.user_id,
          supporterUserId: account.user_id
        })
      )
    }
  }, [shouldFetchUserSupporter, account, receiver, dispatch])

  useEffect(() => {
    if (shouldFetchSupportersForReceiver && account && receiver) {
      dispatch(
        refreshSupport({
          senderUserId: account.user_id,
          receiverUserId: receiver.user_id
        })
      )
    }
  }, [shouldFetchSupportersForReceiver, account, receiver, dispatch])

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

  return (
    <TipScreen
      title={Platform.OS === 'ios' ? messages.sendAudio : messages.sendTip}
      topbarLeft={<TopBarIconButton icon={IconRemove} onPress={handleBack} />}
    >
      <DegradationNotice />
      <ReceiverDetails />
      {!hasInsufficientBalance && isFirstSupporter ? (
        <BecomeFirstSupporter />
      ) : null}
      {!hasInsufficientBalance && amountToTipToBecomeTopSupporter ? (
        <BecomeTopSupporter
          amountToTipToBecomeTopSupporter={amountToTipToBecomeTopSupporter}
        />
      ) : null}
      <TipInput value={tipAmount} onChangeText={setTipAmount} />
      <AvailableAudio />
      <Button
        variant='primary'
        size='large'
        title={Platform.OS === 'ios' ? messages.sendAudio : messages.sendTip}
        onPress={handleSendTip}
        icon={IconArrow}
        iconPosition='right'
        fullWidth
        disabled={
          !tipAmount || tipAmountWei.lte(zeroWei) || hasInsufficientBalance
        }
        style={styles.sendButton}
      />
      {hasInsufficientBalance ? (
        <ErrorText>{messages.insufficientBalance}</ErrorText>
      ) : null}
    </TipScreen>
  )
}
