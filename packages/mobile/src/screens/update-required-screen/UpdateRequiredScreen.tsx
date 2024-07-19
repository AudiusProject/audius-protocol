import { Platform } from 'react-native'

import { NewVersionPrompt } from './NewVersionPrompt'

const SOLANA_DAPP_STORE_LINK = 'solanadappstore://details?id=co.audius.app'
const ANDROID_PLAY_STORE_LINK =
  'https://play.google.com/store/apps/details?id=co.audius.app'
const IOS_APP_STORE_LINK = 'itms-apps://us/app/audius-music/id1491270519'

const messages = {
  header: 'Please Update ✨',
  text: "The version of Audius you're running is too far behind.",
  sagaText:
    "The version of Audius you're running is too far behind. Please update via the dApp Store",
  buttonText: 'Update App'
}

export const UpdateRequiredScreen = () => {
  const isAndroid = Platform.OS === 'android'
  const isSolanaPhone =
    Platform.OS === 'android' && Platform.constants.Model === 'Saga'
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
