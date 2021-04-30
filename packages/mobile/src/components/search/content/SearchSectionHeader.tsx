import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { useTheme } from '../../../utils/theme'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 16,
    paddingBottom: 16
  },
  header: {
    textTransform: 'uppercase',
    fontSize: 17,
    marginRight: 8,
    fontFamily: 'AvenirNextLTPro-Heavy'
  },
  divider: {
    flex: 1,
    borderTopWidth: 1
  }
})

type SearchSectionHeaderProps = { title: string }
const SearchSectionHeader = ({ title }: SearchSectionHeaderProps) => {
  const headerStyle = useTheme(styles.header, {
    color: 'secondary'
  })
  const dividerStyle = useTheme(styles.divider, {
    borderTopColor: 'neutralLight8'
  })
  return (
    <View style={styles.container}>
      <Text style={headerStyle}>{title}</Text>
      <View style={dividerStyle} />
    </View>
  )
}

export default SearchSectionHeader
