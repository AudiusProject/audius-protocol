import { View } from 'react-native'

import { PickArtworkField } from 'app/components/fields'
import { makeStyles } from 'app/styles'

import { RandomImageInput } from './RandomImageButton'

const name = 'artwork'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginBottom: spacing(4)
  }
}))

export const PlaylistImageInput = () => {
  const styles = useStyles()

  return (
    <View style={styles.root}>
      <PickArtworkField name={name} />
      <RandomImageInput name={name} />
    </View>
  )
}
