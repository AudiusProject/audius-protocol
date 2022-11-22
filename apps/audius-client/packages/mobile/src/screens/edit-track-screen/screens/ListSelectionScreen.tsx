import type { ComponentType } from 'react'
import { useState, useCallback } from 'react'

import type { Nullable } from '@audius/common'
import type { ListRenderItem } from 'react-native'
import { FlatList, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import type { SvgProps } from 'react-native-svg'

import { TextInput, Text, RadioButton, Divider } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { FormScreen } from '../components'

export type ListSelectionData = { label: string; value: string }

export type ListSelectionProps = {
  screenTitle: string
  icon: ComponentType<SvgProps>
  searchText: string
  data: ListSelectionData[]
  renderItem: ListRenderItem<ListSelectionData>
  onChange: (value: Nullable<string>) => void
  value: string
}

const messages = {
  selected: 'Selected',
  done: 'Done'
}

const useStyles = makeStyles(({ spacing, typography }) => ({
  root: {
    justifyContent: 'space-between'
  },
  content: { flex: 1 },
  search: {
    marginHorizontal: spacing(2),
    marginTop: spacing(6)
  },
  searchInput: {
    paddingVertical: spacing(3),
    fontSize: typography.fontSize.large
  },
  listHeader: {
    height: spacing(6)
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(4)
  },
  listItemContent: {
    flexDirection: 'row'
  },
  radio: {
    marginRight: spacing(4)
  }
}))

export const ListSelectionScreen = (props: ListSelectionProps) => {
  const {
    screenTitle,
    icon,
    searchText,
    renderItem: renderItemProp,
    data,
    onChange,
    value
  } = props

  const styles = useStyles()

  const [filterInput, setFilterInput] = useState('')
  const filterRegexp = new RegExp(filterInput, 'i')

  const renderItem: ListRenderItem<ListSelectionData> = useCallback(
    (info) => {
      const { value: itemValue } = info.item
      const isSelected = value === itemValue

      const handleChange = () => {
        onChange(isSelected ? null : itemValue)
      }

      return (
        <TouchableOpacity style={styles.listItem} onPress={handleChange}>
          <View style={styles.listItemContent}>
            <RadioButton checked={isSelected} style={styles.radio} />
            {renderItemProp(info)}
          </View>
          {isSelected ? (
            <Text variant='body' color='secondary'>
              {messages.selected}
            </Text>
          ) : null}
        </TouchableOpacity>
      )
    },
    [renderItemProp, value, styles, onChange]
  )

  const filteredData = data.filter(({ label }) => label.match(filterRegexp))

  return (
    <FormScreen
      title={screenTitle}
      icon={icon}
      variant='white'
      style={styles.root}
    >
      <View style={styles.content}>
        <TextInput
          placeholder={searchText}
          styles={{ root: styles.search, input: styles.searchInput }}
          onChangeText={setFilterInput}
          returnKeyType='search'
        />
        <FlatList
          renderItem={renderItem}
          ListHeaderComponent={<View style={styles.listHeader} />}
          ItemSeparatorComponent={Divider}
          data={filteredData}
        />
      </View>
    </FormScreen>
  )
}
