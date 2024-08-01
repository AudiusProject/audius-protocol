import { isAndroid, isSolanaPhone } from 'app/utils/os'
import {
  ANDROID_PLAY_STORE_LINK,
  IOS_APP_STORE_LINK,
  SOLANA_DAPP_STORE_LINK
} from 'app/utils/playStore'

import { NewVersionPrompt } from './NewVersionPrompt'

const messages = {
  header: 'Please Update ✨',
  text: "The version of Audius you're running is too far behind.",
  sagaText:
    "The version of Audius you're running is too far behind. Please update via the dApp Store",
  buttonText: 'Update App'
}

export const UpdateRequiredScreen = () => {
  const url = isSolanaPhone
    ? SOLANA_DAPP_STORE_LINK
    : isAndroid
    ? ANDROID_PLAY_STORE_LINK
    : IOS_APP_STORE_LINK

  return (
    <NewVersionPrompt
      headerText={messages.header}
      contentText={isSolanaPhone ? messages.sagaText : messages.text}
      buttonText={messages.buttonText}
      url={url}
    />
  )
}
