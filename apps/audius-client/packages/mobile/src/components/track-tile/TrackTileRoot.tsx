import { StyleSheet } from 'react-native'

import { Tile, TileProps } from '../core'

const styles = StyleSheet.create({
  tile: {
    minHeight: 152,
    maxWidth: 400
  }
})

type TrackTileRootProps = TileProps

export const TrackTileRoot = (props: TrackTileRootProps) => {
  return <Tile {...props} styles={{ tile: styles.tile }} />
}
