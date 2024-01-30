import { useCallback } from 'react'

import { RandomImage } from '@audius/common'
import { useField } from 'formik'

import { IconSearch } from '@audius/harmony-native'
import { TextButton } from 'app/components/core'
import { flexRowCentered, makeStyles } from 'app/styles'

const messages = {
  getRandomArt: 'Find artwork for me'
}

const blobToBase64 = (blob: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    ...flexRowCentered(),
    justifyContent: 'center',
    marginTop: spacing(4)
  },
  icon: {
    marginRight: spacing(2)
  }
}))

type RandomImageInputProps = {
  name: string
  onProcessing?: (isProcessing: boolean) => void
}

export const RandomImageInput = (props: RandomImageInputProps) => {
  const styles = useStyles()
  const { name, onProcessing } = props
  const [, , { setValue }] = useField(name)

  const handlePress = useCallback(async () => {
    onProcessing?.(true)
    const blob = await RandomImage.get()
    if (blob) {
      const file = await blobToBase64(blob)

      setValue({
        url: file,
        file: { uri: file, name: 'Artwork', type: 'image/jpeg' },
        source: 'unsplash'
      })
      onProcessing?.(false)
    }
  }, [onProcessing, setValue])

  return (
    <TextButton
      variant='secondary'
      title={messages.getRandomArt}
      icon={IconSearch}
      iconPosition='left'
      onPress={handlePress}
      styles={{ root: styles.root, icon: styles.icon }}
    />
  )
}
