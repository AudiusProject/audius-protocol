import type { ReactNode } from 'react'

import { getSearchBarText } from 'audius-client/src/common/store/search-bar/selectors'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'

import { IconArrowRight } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemePalette } from 'app/utils/theme'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing(2),
    columnGap: spacing(3)
  },
  content: {
    flexDirection: 'row'
  }
}))

type SearchResultProps = {
  onPress: () => void
  children: ReactNode
}

export const SearchResultItem = (props: SearchResultProps) => {
  const { onPress, children } = props
  const { neutralLight4 } = useThemePalette()
  const styles = useStyles()

  return (
    <TouchableOpacity style={styles.root} onPress={onPress}>
      {children}
      <IconArrowRight
        fill={neutralLight4}
        height={spacing(4)}
        width={spacing(4)}
      />
    </TouchableOpacity>
  )
}
