import { useCallback } from 'react'

import { useNavigation } from '@react-navigation/native'
import { getAccountUser } from 'audius-client/src/common/store/account/selectors'
import { getSendTipData } from 'audius-client/src/common/store/tipping/selectors'
import { formatNumberCommas } from 'audius-client/src/common/utils/formatUtil'

import IconCheck from 'app/assets/images/iconCheck.svg'
import IconRemove from 'app/assets/images/iconRemove.svg'
import { TextButton } from 'app/components/core'
import { TwitterButton } from 'app/components/twitter-button'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'
import { make } from 'app/utils/analytics'

import { TopBarIconButton } from '../app-screen'

import { DescriptionText } from './DescriptionText'
import { ReceiverDetails } from './ReceiverDetails'
import { TipHeader } from './TipHeader'
import { TipScreen } from './TipScreen'

const messages = {
  title: 'Tip Sent',
  description: 'Share your support on Twitter!',
  done: 'Done',
  twitterCopyPrefix: 'I just tipped ',
  twitterCopySuffix: ' $AUDIO on @AudiusProject #Audius #AUDIOTip'
}

const useStyles = makeStyles(({ spacing }) => ({
  twitter: {
    marginBottom: spacing(6)
  },
  close: {
    alignSelf: 'center'
  }
}))

export const TipSentScreen = () => {
  const account = useSelectorWeb(getAccountUser)
  const {
    user: recipient,
    amount: sendAmount,
    source
  } = useSelectorWeb(getSendTipData)
  const styles = useStyles()
  const navigation = useNavigation()

  const getTwitterShareText = () => {
    const formattedSendAmount = formatNumberCommas(sendAmount)
    if (account && recipient) {
      let recipientAndAmount = `${recipient.name} ${formattedSendAmount}`
      if (recipient.twitter_handle) {
        recipientAndAmount = `@${recipient.twitter_handle} ${formattedSendAmount}`
      }
      return `${messages.twitterCopyPrefix}${recipientAndAmount}${messages.twitterCopySuffix}`
    }
    return ''
  }

  const handleClose = useCallback(() => {
    navigation.getParent()?.goBack()
  }, [navigation])

  return (
    <TipScreen
      title={messages.title}
      topbarLeft={<TopBarIconButton icon={IconRemove} onPress={handleClose} />}>
      <TipHeader status='sent' />
      <ReceiverDetails />
      <DescriptionText>{messages.description}</DescriptionText>
      <TwitterButton
        type='static'
        size='large'
        fullWidth
        styles={{ root: styles.twitter }}
        shareText={getTwitterShareText()}
        analytics={
          account && recipient
            ? make({
                eventName: EventNames.TIP_AUDIO_TWITTER_SHARE,
                senderWallet: account.spl_wallet,
                recipientWallet: recipient.spl_wallet,
                senderHandle: account.handle,
                recipientHandle: recipient.handle,
                amount: sendAmount,
                device: 'native',
                source
              })
            : undefined
        }
      />
      <TextButton
        variant='neutralLight4'
        title={messages.done}
        icon={IconCheck}
        iconPosition='left'
        TextProps={{ variant: 'h1', noGutter: true }}
        onPress={handleClose}
        style={styles.close}
      />
    </TipScreen>
  )
}
