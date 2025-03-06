import { getAAOErrorEmojis } from '@audius/common/utils'

import { Text } from '@audius/harmony-native'

const messages = {
  claimErrorMessage:
    'Something went wrong while claiming your rewards. Please try again and contact support@audius.co.',
  claimErrorMessageAAO:
    'Your account is unable to claim rewards at this time. Please try again later or contact support@audius.co. '
}

/** Renders a generic error message for failed challenge claims */
export const ClaimError = ({ aaoErrorCode }: { aaoErrorCode?: number }) => {
  return aaoErrorCode === undefined ? (
    <Text size='s' color='danger'>
      {messages.claimErrorMessage}
    </Text>
  ) : (
    <Text size='s' color='danger'>
      {messages.claimErrorMessageAAO}
      {getAAOErrorEmojis(aaoErrorCode)}
    </Text>
  )
}
