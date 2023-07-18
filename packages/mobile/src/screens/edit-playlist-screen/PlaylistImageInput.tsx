import { View } from 'react-native'

import { makeStyles } from 'app/styles'

import { PlaylistArtworkField } from './PlaylistArtworkField'
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
      <PlaylistArtworkField name={name} />
      <RandomImageInput name={name} />
    </View>
  )
}
