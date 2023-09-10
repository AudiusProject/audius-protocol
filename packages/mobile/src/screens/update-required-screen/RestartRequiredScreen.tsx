import codePush from 'react-native-code-push'

import { NewVersionPrompt } from './NewVersionPrompt'

const messages = {
  header: 'Update Available ✨',
  text: 'We need to apply some great new changes to the app.',
  buttonText: 'Apply Updates'
}

export const RestartRequiredScreen = () => {
  return (
    <NewVersionPrompt
      headerText={messages.header}
      contentText={messages.text}
      buttonText={messages.buttonText}
      onPress={() => {
        codePush.restartApp()
      }}
    />
  )
}
