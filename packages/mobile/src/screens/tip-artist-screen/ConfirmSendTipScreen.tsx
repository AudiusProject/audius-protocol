import { tippingSelectors, tippingActions } from '@audius/common/store'
import { useCallback, useEffect } from 'react'

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useKeepAwake } from '@sayem314/react-native-keep-awake'
import { Platform } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconCaretLeft from 'app/assets/images/iconCaretLeft.svg'
import IconCheck from 'app/assets/images/iconCheck.svg'
import { Button, TextButton } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { ReceiverDetails } from './ReceiverDetails'
import { SendTipStatusText } from './SendTipStatusText'
import { TipHeader } from './TipHeader'
import { TipScreen } from './TipScreen'
import type { TipArtistNavigationParamList } from './navigation'

const { beginTip, confirmSendTip } = tippingActions
const { getSendTipData } = tippingSelectors

const messages = {
  title: 'Confirm Tip',
  // NOTE: Send tip -> Send $AUDIO change
  titleAlt: 'Confirm', // iOS only
  confirm: 'Confirm Tip',
  confirmAlt: 'Confirm', // iOS only
  goBack: 'Go Back'
}

const useStyles = makeStyles(({ spacing }) => ({
  disclaimer: {
    textAlign: 'center',
    marginBottom: spacing(6)
  },
  confirmButton: {
    marginBottom: spacing(6)
  },
  goBack: {
    alignSelf: 'center'
  }
}))

type ConfirmSendTipScreenProps = NativeStackScreenProps<
  TipArtistNavigationParamList,
  'ConfirmTip'
>

export const ConfirmSendTipScreen = ({
  navigation: nativeNavigation
}: ConfirmSendTipScreenProps) => {
  useKeepAwake()
  const styles = useStyles()
  const {
    user: receiver,
    status: sendStatus,
    source
  } = useSelector(getSendTipData)
  const navigation = useNavigation<TipArtistNavigationParamList>()
  const dispatch = useDispatch()

  const handleConfirm = useCallback(() => {
    dispatch(confirmSendTip())
  }, [dispatch])

  const handleGoBack = useCallback(() => {
    dispatch(beginTip({ user: receiver, source }))
    navigation.goBack()
  }, [dispatch, navigation, receiver, source])

  const inProgress = sendStatus === 'SENDING' || sendStatus === 'CONVERTING'

  useEffect(() => {
    if (sendStatus === 'SUCCESS') {
      navigation.navigate('TipSent')
    }
  }, [sendStatus, navigation])

  // Disable navigating back via swipes
  // if we're in progress
  useEffect(() => {
    nativeNavigation.setOptions({
      gestureEnabled: !inProgress
    })
  }, [nativeNavigation, inProgress])

  return (
    <TipScreen
      title={Platform.OS === 'ios' ? messages.titleAlt : messages.title}
      topbarLeft={inProgress ? null : undefined}
    >
      <TipHeader status='confirm' />
      <ReceiverDetails />
      <SendTipStatusText />
      <Button
        variant='primary'
        size='large'
        title={Platform.OS === 'ios' ? messages.confirmAlt : messages.confirm}
        onPress={handleConfirm}
        icon={inProgress ? LoadingSpinner : IconCheck}
        disabled={inProgress}
        iconPosition='right'
        fullWidth
        style={styles.confirmButton}
      />
      {inProgress ? null : (
        <TextButton
          variant='neutralLight4'
          title={messages.goBack}
          icon={IconCaretLeft}
          iconPosition='left'
          style={styles.goBack}
          TextProps={{ variant: 'h1', noGutter: true }}
          onPress={handleGoBack}
        />
      )}
    </TipScreen>
  )
}
