import { Platform } from 'react-native'

import { NewVersionPrompt } from './NewVersionPrompt'

const ANDROID_PLAY_STORE_LINK =
  'https://play.google.com/store/apps/details?id=co.audius.app'
const IOS_APP_STORE_LINK = 'itms-apps://us/app/audius-music/id1491270519'

const messages = {
  header: 'Please Update ✨',
  text: "The version of Audius you're running is too far behind.",
  buttonText: 'Update App'
}

export const UpdateRequiredScreen = () => {
  const isAndroid = Platform.OS === 'android'
  const url = isAndroid ? ANDROID_PLAY_STORE_LINK : IOS_APP_STORE_LINK

  return (
    <NewVersionPrompt
      headerText={messages.header}
      contentText={messages.text}
      buttonText={messages.buttonText}
      url={url}
    />
  )
}
