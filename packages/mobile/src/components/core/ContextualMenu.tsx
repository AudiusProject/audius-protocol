import { useCallback } from 'react'

import type { ViewStyle } from 'react-native'
import { TouchableOpacity, View } from 'react-native'

import IconCaretRight from 'app/assets/images/iconCaretRight.svg'
import { Divider, Text } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import type { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { InputErrorMessage } from './InputErrorMessage'
import { Pill } from './Pill'

export type ContextualMenuProps = {
  label: string
  value: any
  menuScreenName: string
  styles?: StylesProp<{
    root: ViewStyle
    divider: ViewStyle
    content: ViewStyle
  }>
  error?: boolean
  errorMessage?: string
  lastItem?: boolean
  formattedValue?: string
  renderValue?: (value: any) => JSX.Element | null
}

const useStyles = makeStyles(({ spacing }) => ({
  content: {
    marginVertical: spacing(4),
    paddingHorizontal: spacing(4)
  },
  select: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing(2)
  },
  value: {
    marginHorizontal: spacing(2)
  },
  optionPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing(2)
  },
  pill: {
    marginTop: spacing(2),
    marginRight: spacing(2)
  },
  optionPillText: {
    textTransform: 'uppercase'
  }
}))

export const ContextualMenu = (props: ContextualMenuProps) => {
  const {
    label,
    value,
    menuScreenName,
    styles: stylesProp,
    errorMessage,
    error,
    lastItem,
    renderValue: renderValueProp,
    formattedValue
  } = props
  const styles = useStyles()

  const { neutralLight4 } = useThemeColors()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate(menuScreenName)
  }, [navigation, menuScreenName])

  const defaultRenderValue = (value: string | string[]) => {
    const values = typeof value === 'string' ? [value] : value

    return (
      <View style={styles.optionPills}>
        {values.map((value) => (
          <Pill key={value} style={styles.pill}>
            <Text
              fontSize='small'
              weight='demiBold'
              style={styles.optionPillText}
            >
              {value}
            </Text>
          </Pill>
        ))}
      </View>
    )
  }

  const renderValue = renderValueProp ?? defaultRenderValue

  const hasValue = !value
    ? false
    : typeof value === 'string'
    ? value
    : value.length !== 0

  return (
    <TouchableOpacity onPress={handlePress} style={stylesProp?.root}>
      <Divider style={stylesProp?.divider} />
      <View style={[styles.content, stylesProp?.content]}>
        <View style={styles.select}>
          <Text fontSize='large' weight='demiBold'>
            {label}
          </Text>
          <IconCaretRight
            fill={neutralLight4}
            height={spacing(4)}
            width={spacing(4)}
          />
        </View>
        {hasValue ? (
          <View style={styles.value}>
            {renderValue(formattedValue ?? value)}
          </View>
        ) : null}
        {error && errorMessage ? (
          <InputErrorMessage message={errorMessage} />
        ) : null}
      </View>
      {lastItem ? <Divider style={stylesProp?.divider} /> : null}
    </TouchableOpacity>
  )
}
