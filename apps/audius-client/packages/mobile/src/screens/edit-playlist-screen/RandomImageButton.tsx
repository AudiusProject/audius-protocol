import { useCallback } from 'react'

import { RandomImage } from '@audius/common'
import { useField } from 'formik'

import IconCamera from 'app/assets/images/iconCamera.svg'
import { TextButton } from 'app/components/core'
import { flexRowCentered, makeStyles } from 'app/styles'

const messages = {
  getRandomArt: 'Get Random Artwork'
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
    marginTop: spacing(2)
  }
}))

type RandomImageInputProps = {
  name: string
  onProcessing: (isProcessing: boolean) => void
}

export const RandomImageInput = (props: RandomImageInputProps) => {
  const styles = useStyles()
  const { name, onProcessing } = props
  const [, , { setValue }] = useField(name)

  const handlePress = useCallback(async () => {
    onProcessing(true)
    const blob = await RandomImage.get()
    if (blob) {
      const url = URL.createObjectURL(blob)
      const file = await blobToBase64(blob)
      setValue({ url, file, type: 'base64' })
      onProcessing(false)
    }
  }, [onProcessing, setValue])

  return (
    <TextButton
      variant='secondary'
      title={messages.getRandomArt}
      icon={IconCamera}
      iconPosition='left'
      onPress={handlePress}
      style={styles.root}
    />
  )
}
