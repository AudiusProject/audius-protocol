import { TextInputProps } from 'react-native'

import IconFilter from 'app/assets/images/iconFilter.svg'
import { SearchInput, Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'

type FilterInputProps = TextInputProps

const useStyles = makeStyles(({ palette, spacing }) => ({
  tileRoot: {
    margin: spacing(4)
  },
  tile: {
    padding: spacing(2)
  },
  input: {
    backgroundColor: palette.neutralLight10
  }
}))

export const FilterInput = ({
  value,
  onChangeText,
  placeholder
}: FilterInputProps) => {
  const styles = useStyles()
  return (
    <Tile styles={{ root: styles.tileRoot, tile: styles.tile }}>
      <SearchInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        Icon={IconFilter}
      />
    </Tile>
  )
}
