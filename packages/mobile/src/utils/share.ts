import { Share } from 'react-native'

// Docs for react native share: https://facebook.github.io/react-native/docs/share

type ShareProps = {
  message: string
  url: string
}

const share = async ({ message, url }: ShareProps) => {
  try {
    await Share.share({
      message: `${message} ${url}`
    })
  } catch (error) {}
}

export default share
