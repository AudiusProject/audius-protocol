import { useCallback } from 'react'

import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import IconCaretRight from 'app/assets/images/iconCaretRight.svg'
import { Divider, Text } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import type {
  ListSelectionData,
  ListSelectionParams
} from 'app/screens/list-selection-screen'
import type { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { InputErrorMessage } from './InputErrorMessage'

type ListSelectionProps = Omit<
  ListSelectionParams,
  'data' | 'onChange' | 'value'
>

export type ContextualSubmenuProps = {
  label: string
  data: ListSelectionData[]
  onChange: (value: string) => void
  value: string
  ListSelectionProps: ListSelectionProps
  styles?: StylesProp<{ divider: ViewStyle }>
  error?: boolean
  errorMessage?: string
}

const useStyles = makeStyles(({ spacing }) => ({
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing(4)
  }
}))

export const ContextualSubmenu = (props: ContextualSubmenuProps) => {
  const {
    label,
    value,
    data,
    onChange,
    ListSelectionProps,
    styles: stylesProp,
    errorMessage,
    error
  } = props
  const styles = useStyles()

  const { neutralLight4 } = useThemeColors()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    const params = {
      ...ListSelectionProps,
      data,
      value,
      onChange
    }
    navigation.push('ListSelection', params)
  }, [navigation, ListSelectionProps, data, value, onChange])

  return (
    <TouchableOpacity onPress={handlePress}>
      <Divider style={stylesProp?.divider} />
      <View style={styles.content}>
        <Text fontSize='large' weight='demiBold'>
          {label}
        </Text>
        {value ? <Text>{value}</Text> : null}
        <IconCaretRight
          fill={neutralLight4}
          height={spacing(4)}
          width={spacing(4)}
        />
      </View>
      {error && errorMessage ? (
        <InputErrorMessage message={errorMessage} />
      ) : null}
      <Divider style={stylesProp?.divider} />
    </TouchableOpacity>
  )
}
