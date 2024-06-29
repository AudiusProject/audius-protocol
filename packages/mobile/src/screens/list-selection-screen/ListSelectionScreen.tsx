import type { ComponentType, ReactElement, ReactNode } from 'react'
import { useState, useCallback } from 'react'

import type { Nullable } from '@audius/common/utils'
import type { ListRenderItem, ViewStyle } from 'react-native'
import { FlatList, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import type { SvgProps } from 'react-native-svg'

import { TextInput, Text, RadioButton, Divider } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'
import { FormScreen, FormScreenProps } from 'app/screens/form-screen'
import { Flex } from '@audius/harmony-native'

export type ListSelectionData = {
  label: string
  value: string
  disabled?: boolean
}

export type ListSelectionProps = Partial<Omit<FormScreenProps, 'header'>> & {
  screenTitle: string
  icon?: ComponentType<SvgProps>
  data: ListSelectionData[]
  renderItem?: ListRenderItem<ListSelectionData>
  onChange: (value: any) => void
  value: string
  searchText?: string
  isLoading?: boolean
  disableSearch?: boolean
  allowDeselect?: boolean
  hideSelectionLabel?: boolean
  itemStyles?: ViewStyle
  itemContentStyles?: ViewStyle
  topbarLeft?: Nullable<ReactElement>
  header?: ReactNode
  footer?: ReactNode
}

const messages = {
  loading: 'Loading...',
  selected: 'Selected',
  done: 'Done'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: {
    justifyContent: 'space-between'
  },
  content: { flex: 1 },
  noFlex: { flex: undefined },
  searchInput: {
    paddingVertical: spacing(3),
    fontSize: typography.fontSize.large
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
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  loadingText: {
    fontFamily: typography.fontByWeight.demiBold,
    fontSize: typography.fontSize.large,
    marginLeft: spacing(4)
  },
  loadingSpinnerView: {
    width: spacing(6),
    height: spacing(6)
  },
  loadingSpinner: {
    color: palette.neutral
  }
}))

const defaultRenderItem: ListRenderItem<ListSelectionData> = ({ item }) => (
  <Text>{item.label}</Text>
)

export const ListSelectionScreen = (props: ListSelectionProps) => {
  const {
    screenTitle,
    icon,
    renderItem: renderItemProp = defaultRenderItem,
    data,
    onChange,
    value,
    searchText = '',
    isLoading = false,
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
        <Flex p='l'>{header}</Flex>
        {disableSearch ? null : (
          <Flex p='l'>
            <TextInput
              placeholder={searchText}
              styles={{ input: styles.searchInput }}
              onChangeText={setFilterInput}
              returnKeyType='search'
            />
          </Flex>
        )}
        {isLoading ? (
          <View style={styles.listItem}>
            <View style={styles.listItemContent}>
              <View style={styles.loading}>
                <LoadingSpinner
                  fill={styles.loadingSpinner.color}
                  style={styles.loadingSpinnerView}
                />
                <Text style={styles.loadingText} numberOfLines={1}>
                  {messages.loading}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            renderItem={renderItem}
            ItemSeparatorComponent={Divider}
            data={filteredData}
          />
        )}
        {footer}
      </View>
    </FormScreen>
  )
}
