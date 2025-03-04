import { getAAOErrorEmojis } from '@audius/common/utils'

import { Text } from '@audius/harmony-native'

const messages = {
  claimErrorMessage:
    'Something has gone wrong, not all your rewards were claimed. Please try again.',
  claimErrorMessageAAO:
    'Your account is unable to claim rewards at this time. Please try again later or contact support@audius.co. '
}

/** Renders a generic error message for failed challenge claims */
export const ClaimError = ({ aaoErrorCode }: { aaoErrorCode?: number }) => {
  return aaoErrorCode === undefined ? (
    <Text>{messages.claimErrorMessage}</Text>
  ) : (
    <Text>
      {messages.claimErrorMessageAAO}
      {getAAOErrorEmojis(aaoErrorCode)}
    </Text>
  )
}
