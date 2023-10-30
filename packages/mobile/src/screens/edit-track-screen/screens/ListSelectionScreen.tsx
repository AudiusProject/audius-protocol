import type { ComponentType, ReactElement, ReactNode } from 'react'
import { useState, useCallback } from 'react'

import type { Nullable } from '@audius/common'
import type { ListRenderItem, ViewStyle } from 'react-native'
import { FlatList, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import type { SvgProps } from 'react-native-svg'

import { TextInput, Text, RadioButton, Divider } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { FormScreen } from '../components'

export type ListSelectionData = {
  label: string
  value: string
  disabled?: boolean
}

export type ListSelectionProps = {
  screenTitle: string
  icon: ComponentType<SvgProps>
  data: ListSelectionData[]
  renderItem: ListRenderItem<ListSelectionData>
  onChange: (value: any) => void
  value: string
  searchText?: string
  disableSearch?: boolean
  allowDeselect?: boolean
  hideSelectionLabel?: boolean
  itemStyles?: ViewStyle
  itemContentStyles?: ViewStyle
  topbarLeft?: Nullable<ReactElement>
  header?: ReactNode
  bottomSection?: ReactNode
  footer?: ReactNode
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
  noFlex: { flex: undefined },
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
    renderItem: renderItemProp,
    data,
    onChange,
    value,
    searchText = '',
    disableSearch = false,
    allowDeselect = true,
    hideSelectionLabel = false,
    itemStyles,
    itemContentStyles,
    topbarLeft,
    header,
    bottomSection,
    footer
  } = props

  const styles = useStyles()

  const [filterInput, setFilterInput] = useState('')
  const filterRegexp = new RegExp(filterInput, 'i')

  const renderItem: ListRenderItem<ListSelectionData> = useCallback(
    (info) => {
      const { value: itemValue, disabled } = info.item
      const isSelected = value === itemValue

      const handleChange = () => {
        if (isSelected) {
          if (allowDeselect) {
            onChange(null)
          }
        } else {
          onChange(itemValue)
        }
      }

      if (disabled) {
        return (
          <View style={styles.listItem}>
            <View style={styles.listItemContent}>
              <RadioButton
                checked={isSelected}
                disabled={disabled}
                style={styles.radio}
              />
              {renderItemProp(info)}
            </View>
          </View>
        )
      }

      if (isSelected && !allowDeselect) {
        return (
          <View style={[styles.listItem, itemStyles]}>
            <View style={[styles.listItemContent, itemContentStyles]}>
              <RadioButton checked={isSelected} style={styles.radio} />
              {renderItemProp(info)}
            </View>
            {!hideSelectionLabel ? (
              <Text variant='body' color='secondary'>
                {messages.selected}
              </Text>
            ) : null}
          </View>
        )
      }

      return (
        <TouchableOpacity
          style={[styles.listItem, itemStyles]}
          onPress={handleChange}
        >
          <View style={[styles.listItemContent, itemContentStyles]}>
            <RadioButton checked={isSelected} style={styles.radio} />
            {renderItemProp(info)}
          </View>
          {isSelected && !hideSelectionLabel ? (
            <Text variant='body' color='secondary'>
              {messages.selected}
            </Text>
          ) : null}
        </TouchableOpacity>
      )
    },
    [
      renderItemProp,
      value,
      styles,
      onChange,
      allowDeselect,
      hideSelectionLabel,
      itemStyles,
      itemContentStyles
    ]
  )

  const filteredData = data.filter(({ label }) => label.match(filterRegexp))

  return (
    <FormScreen
      title={screenTitle}
      icon={icon}
      variant='white'
      style={styles.root}
      topbarLeft={topbarLeft}
      bottomSection={bottomSection}
    >
      <View style={[styles.content, footer ? styles.noFlex : undefined]}>
        {header}
        {!disableSearch && (
          <TextInput
            placeholder={searchText}
            styles={{ root: styles.search, input: styles.searchInput }}
            onChangeText={setFilterInput}
            returnKeyType='search'
          />
        )}
        <FlatList
          renderItem={renderItem}
          ListHeaderComponent={<View style={styles.listHeader} />}
          ItemSeparatorComponent={Divider}
          data={filteredData}
        />
        {footer}
      </View>
    </FormScreen>
  )
}
