import { View } from 'react-native'

import Skeleton from 'app/components/skeleton'
import { makeStyles } from 'app/styles'

import { Tile } from '../core'

const useStyles = makeStyles(({ spacing, palette }) => ({
  tile: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing(3),
    marginTop: spacing(3),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(4)
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  metadata: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly'
  },
  profile: {
    borderRadius: 21,
    width: 42,
    height: 42
  },
  name: {
    marginLeft: spacing(3),
    height: 32
  },
  explainer: {
    marginTop: 20,
    height: 16
  },
  send: {
    marginTop: 16,
    height: 32
  }
}))

export const FeedTipTileSkeleton = () => {
  const styles = useStyles()
  return (
    <Tile styles={{ tile: styles.tile }}>
      <View style={styles.header}>
        <Skeleton style={styles.profile} />
        <Skeleton style={styles.name} width='75%' height='100%' />
      </View>
      <View style={styles.metadata}>
        <Skeleton style={styles.explainer} width='80%' height='100%' />
        <Skeleton style={styles.send} width='100%' height='100%' />
      </View>
    </Tile>
  )
}
