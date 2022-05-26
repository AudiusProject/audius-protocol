import { useCallback, useState } from 'react'

import { StringAudio } from 'audius-client/src/common/models/Wallet'
import { getAccountBalance } from 'audius-client/src/common/store/wallet/selectors'
import { parseAudioInputToWei } from 'audius-client/src/common/utils/wallet'

import IconArrow from 'app/assets/images/iconArrow.svg'
import IconRemove from 'app/assets/images/iconRemove.svg'
import { Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { TopBarIconButton } from '../app-screen'

import { AvailableAudio } from './AvailableAudio'
import { ErrorText } from './ErrorText'
import { ReceiverDetails } from './ReceiverDetails'
import { TipInput } from './TipInput'
import { TipScreen } from './TipScreen'
import { TipArtistNavigationParamList } from './navigation'

const messages = {
  sendTip: 'Send Tip',
  insufficientBalance: 'Insufficient Balance'
}

const useStyles = makeStyles(({ spacing }) => ({
  sendButton: {
    marginBottom: spacing(6)
  }
}))

export const SendTipScreen = () => {
  const styles = useStyles()
  const [tipAmount, setTipAmount] = useState('')
  const accountBalance = useSelectorWeb(getAccountBalance)
  const navigation = useNavigation<TipArtistNavigationParamList>()

  const hasInsufficientBalance =
    accountBalance &&
    parseAudioInputToWei(tipAmount as StringAudio)?.gt(accountBalance)

  const handleBack = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleSendTip = useCallback(() => {
    navigation.navigate({ native: { screen: 'ConfirmTip' } })
  }, [navigation])

  return (
    <TipScreen
      title={messages.sendTip}
      topbarLeft={<TopBarIconButton icon={IconRemove} onPress={handleBack} />}
    >
      <ReceiverDetails />
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
        disabled={!tipAmount || hasInsufficientBalance}
        style={styles.sendButton}
      />
      {hasInsufficientBalance ? (
        <ErrorText>{messages.insufficientBalance}</ErrorText>
      ) : null}
    </TipScreen>
  )
}
