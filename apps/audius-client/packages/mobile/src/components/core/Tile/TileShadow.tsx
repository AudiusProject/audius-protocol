import { StyleSheet, View } from 'react-native'
import { Shadow, ShadowProps } from 'react-native-shadow-2'

import { makeStyles } from 'app/styles'

type TileShadowProps = ShadowProps & {
  borderRadius: number
  inset: number
}

const useStyles = makeStyles((_, { borderRadius, inset }) => ({
  view: {
    flex: 1,
    alignSelf: 'stretch',
    borderRadius: borderRadius - inset
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    margin: inset
  }
}))

export const TileShadow = (props: TileShadowProps) => {
  const { borderRadius, inset, ...other } = props
  const styles = useStyles({ borderRadius, inset })
  return (
    <Shadow
      viewStyle={styles.view}
      containerViewStyle={styles.container}
      {...other}
    >
      <View />
    </Shadow>
  )
}
