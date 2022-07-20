import { getSendStatus } from 'audius-client/src/common/store/tipping/selectors'
import { View } from 'react-native'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { DescriptionText } from './DescriptionText'

const messages = {
  disclaimer: 'Are you sure? This tip cannot be reversed.',
  maintenance: 'We’re performing some necessary one-time maintenance.',
  fewMinutes: 'This may take a few minutes.',
  holdOn: 'Don’t close this screen or restart the app.',
  somethingWrong: 'Something’s gone wrong. Wait a little while and try again.'
}

export const SendTipStatusText = () => {
  const sendStatus = useSelectorWeb(getSendStatus)

  if (sendStatus === 'CONFIRM')
    return <DescriptionText>{messages.disclaimer}</DescriptionText>
  if (sendStatus === 'SENDING') return null
  if (sendStatus === 'CONVERTING')
    return (
      <View>
        <DescriptionText>{messages.maintenance}</DescriptionText>
        <DescriptionText>
          {messages.fewMinutes} {'\n'}
          {messages.holdOn}
        </DescriptionText>
      </View>
    )
  if (sendStatus === 'ERROR')
    return (
      <DescriptionText color='error'>{messages.somethingWrong}</DescriptionText>
    )

  return null
}
