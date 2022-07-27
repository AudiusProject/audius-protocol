import { useCallback, useEffect, useState } from 'react'

import type { BNWei, StringWei } from '@audius/common'
import { useFocusEffect } from '@react-navigation/native'
import { getAccountUser } from 'audius-client/src/common/store/account/selectors'
import {
  getOptimisticSupporters,
  getOptimisticSupporting,
  getSendUser
} from 'audius-client/src/common/store/tipping/selectors'
import {
  sendTip,
  fetchUserSupporter
} from 'audius-client/src/common/store/tipping/slice'
import { getAccountBalance } from 'audius-client/src/common/store/wallet/selectors'
import { getBalance } from 'audius-client/src/common/store/wallet/slice'
import { stringWeiToBN } from 'audius-client/src/common/utils/wallet'
import { useGetFirstOrTopSupporter } from 'audius-client/src/hooks/useGetFirstOrTopSupporter'
import BN from 'bn.js'

import IconArrow from 'app/assets/images/iconArrow.svg'
import IconRemove from 'app/assets/images/iconRemove.svg'
import { Button } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { TopBarIconButton } from '../app-screen'

import { AvailableAudio } from './AvailableAudio'
import { BecomeFirstSupporter } from './BecomeFirstSupporter'
import { BecomeTopSupporter } from './BecomeTopSupporter'
import { ErrorText } from './ErrorText'
import { ReceiverDetails } from './ReceiverDetails'
import { TipInput } from './TipInput'
import { TipScreen } from './TipScreen'
import type { TipArtistNavigationParamList } from './navigation'

const messages = {
  sendTip: 'Send Tip',
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
  const accountBalance = (useSelectorWeb(getAccountBalance) ??
    new BN('0')) as BNWei
  const navigation = useNavigation<TipArtistNavigationParamList>()
  const dispatchWeb = useDispatchWeb()

  const account = useSelectorWeb(getAccountUser)
  const supportersMap = useSelectorWeb(getOptimisticSupporters)
  const supportingMap = useSelectorWeb(getOptimisticSupporting)
  const receiver = useSelectorWeb(getSendUser)

  const {
    amountToTipToBecomeTopSupporter,
    shouldFetchUserSupporter,
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
      dispatchWeb(
        fetchUserSupporter({
          currentUserId: account.user_id,
          userId: receiver.user_id,
          supporterUserId: account.user_id
        })
      )
    }
  }, [shouldFetchUserSupporter, account, receiver, dispatchWeb])

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleSendTip = useCallback(() => {
    dispatchWeb(sendTip({ amount: tipAmount }))
    navigation.navigate({ native: { screen: 'ConfirmTip' } })
  }, [dispatchWeb, tipAmount, navigation])

  useFocusEffect(
    useCallback(() => {
      dispatchWeb(getBalance())
    }, [dispatchWeb])
  )

  return (
    <TipScreen
      title={messages.sendTip}
      topbarLeft={<TopBarIconButton icon={IconRemove} onPress={handleBack} />}>
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
        title={messages.sendTip}
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
