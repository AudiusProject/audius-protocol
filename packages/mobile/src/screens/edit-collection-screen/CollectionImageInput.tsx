import { View } from 'react-native'

import { makeStyles } from 'app/styles'

import { CollectionArtworkField } from './CollectionArtworkField'
import { RandomImageInput } from './RandomImageButton'

const name = 'artwork'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginBottom: spacing(4)
  }
}))

export const CollectionImageInput = () => {
  const styles = useStyles()

  return (
    <View style={styles.root}>
      <CollectionArtworkField name={name} />
      <RandomImageInput name={name} />
    </View>
  )
}
