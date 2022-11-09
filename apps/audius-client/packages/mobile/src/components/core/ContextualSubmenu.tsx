import { useCallback } from 'react'

import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import IconCaretRight from 'app/assets/images/iconCaretRight.svg'
import { Divider, Text } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import type { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { InputErrorMessage } from './InputErrorMessage'
import { Pill } from './Pill'

export type ContextualSubmenuProps = {
  label: string
  onChange: (value: any) => void
  value: any
  submenuScreenName: string
  styles?: StylesProp<{
    root: ViewStyle
    divider: ViewStyle
    content: ViewStyle
  }>
  error?: boolean
  errorMessage?: string
  lastItem?: boolean
  renderValue?: (value: any) => void
}

const useStyles = makeStyles(({ spacing }) => ({
  content: {
    marginVertical: spacing(4)
  },
  select: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  optionPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing(4)
  },
  optionPillText: {
    textTransform: 'uppercase'
  }
}))

export const ContextualSubmenu = (props: ContextualSubmenuProps) => {
  const {
    label,
    value,
    onChange,
    submenuScreenName,
    styles: stylesProp,
    errorMessage,
    error,
    lastItem,
    renderValue: renderValueProp
  } = props
  const styles = useStyles()

  const { neutralLight4 } = useThemeColors()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    const params = { value, onChange }
    navigation.push(submenuScreenName, params)
  }, [navigation, value, onChange, submenuScreenName])

  const defaultRenderValue = (value: any) => (
    <View style={styles.optionPills}>
      <Pill>
        <Text fontSize='small' weight='demiBold' style={styles.optionPillText}>
          {value}
        </Text>
      </Pill>
    </View>
  )
  const renderValue = renderValueProp ?? defaultRenderValue

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
        {value ? renderValue(value) : null}
        {error && errorMessage ? (
          <InputErrorMessage message={errorMessage} />
        ) : null}
      </View>
      {lastItem ? <Divider style={stylesProp?.divider} /> : null}
    </TouchableOpacity>
  )
}
