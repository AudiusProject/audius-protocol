import type { TextInputProps } from 'react-native'
import Animated, { Layout } from 'react-native-reanimated'

import { IconFilter } from '@audius/harmony-native'
import { TextInput, Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'

type FilterInputProps = TextInputProps

const useStyles = makeStyles(({ spacing }) => ({
  tileRoot: {
    marginVertical: spacing(4),
    marginHorizontal: spacing(3)
  },
  tile: {
    padding: spacing(2)
  }
}))

export const FilterInput = (props: FilterInputProps) => {
  const { onChangeText, placeholder } = props
  const styles = useStyles()

  return (
    <Animated.View layout={Layout}>
      <Tile styles={{ root: styles.tileRoot, tile: styles.tile }}>
        <TextInput
          placeholder={placeholder}
          onChangeText={onChangeText}
          returnKeyType='search'
          Icon={IconFilter}
        />
      </Tile>
    </Animated.View>
  )
}
