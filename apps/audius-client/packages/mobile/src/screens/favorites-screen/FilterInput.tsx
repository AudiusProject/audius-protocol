import type { TextInputProps } from 'react-native'

import IconFilter from 'app/assets/images/iconFilter.svg'
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
    <Tile styles={{ root: styles.tileRoot, tile: styles.tile }}>
      <TextInput
        placeholder={placeholder}
        onChangeText={onChangeText}
        returnKeyType='search'
        Icon={IconFilter}
      />
    </Tile>
  )
}
