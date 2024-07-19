import { useCallback } from 'react'

import dayjs from 'dayjs'
import { Pressable } from 'react-native'
import type { ReactNativeModalDateTimePickerProps } from 'react-native-modal-datetime-picker'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { useToggle } from 'react-use'

import { TextInput, useTheme } from '@audius/harmony-native'
import type { TextInputProps } from '@audius/harmony-native'

type DateTimeModalProps = {
  date?: string
  onChange: (date: string) => void
  mode: ReactNativeModalDateTimePickerProps['mode']
  inputProps: TextInputProps
  dateTimeProps?: Partial<ReactNativeModalDateTimePickerProps>
  formatDate?: (date: string) => string
}

export const DateTimeInput = (props: DateTimeModalProps) => {
  const {
    date,
    onChange,
    mode,
    inputProps,
    dateTimeProps,
    formatDate = (date) =>
      dayjs(date).format(mode === 'date' ? 'M/D/YY' : 'h:mm A')
  } = props
  const { color, type } = useTheme()
  const [isDateTimeOpen, toggleDateTimeOpen] = useToggle(false)

  const handleChange = useCallback(
    (date: Date) => {
      onChange(date.toString())
      toggleDateTimeOpen()
    },
    [onChange, toggleDateTimeOpen]
  )

  const dateProps: Partial<ReactNativeModalDateTimePickerProps> = {
    display: 'inline',
    accentColor: color.primary.primary,
    themeVariant: type === 'day' ? 'light' : 'dark',
    isDarkModeEnabled: type !== 'day'
  }

  return (
    <>
      <Pressable onPress={toggleDateTimeOpen}>
        <TextInput
          readOnly
          _disablePointerEvents
          value={date ? formatDate(date) : ''}
          {...inputProps}
        />
      </Pressable>
      <DateTimePickerModal
        {...dateTimeProps}
        date={date ? new Date(date) : new Date()}
        mode={mode}
        isVisible={isDateTimeOpen}
        onConfirm={handleChange}
        onCancel={toggleDateTimeOpen}
        {...(mode === 'date' ? dateProps : {})}
      />
    </>
  )
}
