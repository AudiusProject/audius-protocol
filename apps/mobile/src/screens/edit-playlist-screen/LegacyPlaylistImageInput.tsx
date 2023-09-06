import { useState } from 'react'

import { View } from 'react-native'

import { FormImageInput } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { RandomImageInput } from './LegacyRandomImageButton'

const name = 'artwork'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(8)
  }
}))

export const PlaylistImageInput = () => {
  const styles = useStyles()
  const [isProcessingImage, setIsProcessingImage] = useState(false)

  return (
    <View style={styles.root}>
      <FormImageInput name={name} isProcessing={isProcessingImage} />
      <RandomImageInput name={name} onProcessing={setIsProcessingImage} />
    </View>
  )
}
