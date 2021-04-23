import React from 'react'
import {
  StyleSheet,
  View,
  Text
} from 'react-native'
import IconBigSearch from '../../../assets/images/iconBigSearch.svg'
import { useColor, useTheme } from '../../../utils/theme'

const messages = {
  empty: 'Search for Artists, Tracks, Playlists, & Albums',
  noResults: 'Sorry, we couldn’t find anything that matches'
}

const styles = StyleSheet.create({
  emptyContainer: {
    marginTop: 116,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 18,
    fontWeight: 'bold',
    width: 240
  }
})


type EmptySearchProps = { query?: string }
const EmptySearch = ({ query = '' }: EmptySearchProps) => {
  const color = useColor('neutralLight4')
  const emptyTextStyle = useTheme(styles.emptyText, { color: 'neutralLight4' })

  const text = query === '' ? messages.empty : `${messages.noResults} "${query}"` 
  return (
    <View style={styles.emptyContainer}>
    <IconBigSearch width={90} height={90} fill={color} />
    <Text style={emptyTextStyle}>{text}</Text>
  </View>
)
}
export default EmptySearch
