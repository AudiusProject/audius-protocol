import { useCallback, useEffect } from 'react'

import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { getSendTipData } from 'audius-client/src/common/store/tipping/selectors'
import {
  beginTip,
  confirmSendTip
} from 'audius-client/src/common/store/tipping/slice'

import IconCaretLeft from 'app/assets/images/iconCaretLeft.svg'
import IconCheck from 'app/assets/images/iconCheck.svg'
import { Button, TextButton } from 'app/components/core'
import loadingSpinner from 'app/components/loading-spinner'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { ReceiverDetails } from './ReceiverDetails'
import { SendTipStatusText } from './SendTipStatusText'
import { TipHeader } from './TipHeader'
import { TipScreen } from './TipScreen'
import type { TipArtistNavigationParamList } from './navigation'

const messages = {
  title: 'Confirm Tip',
  confirm: 'Confirm Tip',
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
  const styles = useStyles()
  const {
    user: receiver,
    status: sendStatus,
    source
  } = useSelectorWeb(getSendTipData)
  const navigation = useNavigation<TipArtistNavigationParamList>()
  const dispatchWeb = useDispatchWeb()

  const handleConfirm = useCallback(() => {
    dispatchWeb(confirmSendTip())
  }, [dispatchWeb])

  const handleGoBack = useCallback(() => {
    dispatchWeb(beginTip({ user: receiver, source }))
    navigation.goBack()
  }, [dispatchWeb, navigation, receiver, source])

  const inProgress = sendStatus === 'SENDING' || sendStatus === 'CONVERTING'

  useEffect(() => {
    if (sendStatus === 'SUCCESS') {
      navigation.navigate({ native: { screen: 'TipSent' } })
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
      title={messages.title}
      topbarLeft={inProgress ? null : undefined}
    >
      <TipHeader status='confirm' />
      <ReceiverDetails />
      <SendTipStatusText />
      <Button
        variant='primary'
        size='large'
        title={messages.confirm}
        onPress={handleConfirm}
        icon={inProgress ? loadingSpinner : IconCheck}
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
