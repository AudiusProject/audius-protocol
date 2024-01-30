import { View } from 'react-native'

import IconBigSearch from 'app/assets/images/iconBigSearch.svg'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useColor } from 'app/utils/theme'

const messages = {
  empty: 'Search for Artists, Tracks, Playlists, & Albums',
  noResults: 'Sorry, we couldn’t find anything that matches'
}

const useStyles = makeStyles(({ spacing }) => ({
  emptyContainer: {
    marginTop: 116,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing(4),
    width: 240
  }
}))

type EmptySearchProps = { query?: string }

export const EmptySearch = ({ query = '' }: EmptySearchProps) => {
  const styles = useStyles()
  const color = useColor('neutralLight4')

  const text =
    query === '' ? messages.empty : `${messages.noResults} "${query}"`

  return (
    <View style={styles.emptyContainer}>
      <IconBigSearch width={90} height={90} fill={color} />
      <Text variant='h1' style={styles.emptyText}>
        {text}
      </Text>
    </View>
  )
}
