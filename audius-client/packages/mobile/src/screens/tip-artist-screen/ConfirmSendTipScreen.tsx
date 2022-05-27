import { useCallback, useEffect } from 'react'

import { getSendStatus } from 'audius-client/src/common/store/tipping/selectors'
import { confirmSendTip } from 'audius-client/src/common/store/tipping/slice'

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
import { TipArtistNavigationParamList } from './navigation'

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

export const ConfirmSendTipScreen = () => {
  const styles = useStyles()
  const sendStatus = useSelectorWeb(getSendStatus)
  const navigation = useNavigation<TipArtistNavigationParamList>()
  const dispatchWeb = useDispatchWeb()

  const handleConfirm = useCallback(() => {
    dispatchWeb(confirmSendTip())
  }, [dispatchWeb])

  const handleGoBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const inProgress = sendStatus === 'SENDING' || sendStatus === 'CONVERTING'

  useEffect(() => {
    if (sendStatus === 'SUCCESS') {
      navigation.navigate({ native: { screen: 'TipSent' } })
    }
  }, [sendStatus, navigation])

  return (
    <TipScreen title={messages.title}>
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
