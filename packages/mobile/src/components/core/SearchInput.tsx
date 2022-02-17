import { forwardRef } from 'react'

import { TextInput, TextInputProps, View } from 'react-native'

import IconSearch from 'app/assets/images/iconSearch.svg'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderColor: palette.neutralLight7,
    backgroundColor: palette.neutralLight10
  },
  input: {
    flex: 1,
    color: palette.neutral,
    fontFamily: typography.fontByWeight.medium
  },
  icon: {
    fill: palette.neutralLight5,
    height: spacing(4),
    width: spacing(4)
  }
}))

type SearchInputProps = TextInputProps

export const SearchInput = forwardRef<TextInput, SearchInputProps>(
  (props, ref) => {
    const { style, ...other } = props
    const styles = useStyles()
    return (
      <View style={[styles.root, style]}>
        <TextInput
          ref={ref}
          style={styles.input}
          underlineColorAndroid='transparent'
          autoComplete='off'
          autoCorrect={false}
          returnKeyType='search'
          {...other}
        />
        <IconSearch
          style={styles.icon}
          fill={styles.icon.fill}
          height={16}
          width={16}
        />
      </View>
    )
  }
)
