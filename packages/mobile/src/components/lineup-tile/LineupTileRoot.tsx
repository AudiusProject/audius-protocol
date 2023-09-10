import { StyleSheet } from 'react-native'

import type { TileProps } from 'app/components/core'
import { Tile } from 'app/components/core'

const styles = StyleSheet.create({
  tile: {
    minHeight: 152
  }
})

type LineupTileRootProps = TileProps

export const LineupTileRoot = (props: LineupTileRootProps) => {
  return <Tile {...props} styles={{ tile: [styles.tile, props.style] }} />
}
