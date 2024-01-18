import { env } from 'app/env'
import { Share } from 'react-native'

// Docs for react native share: https://facebook.github.io/react-native/docs/share

type ShareProps = {
  message?: string
  url: string
}

const share = async ({ message, url }: ShareProps) => {
  const fullUrl = `${env.AUDIUS_URL}${url}`

  try {
    // on iOS we can have both message and URL, on android, we need to concat
    const context = { message: message ? `${message} ${fullUrl}` : fullUrl }
    await Share.share(context)
  } catch (error) {
    console.error(error)
  }
}

export default share
