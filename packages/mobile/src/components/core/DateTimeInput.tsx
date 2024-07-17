import { useCallback } from 'react'

import dayjs from 'dayjs'
import calendar from 'dayjs/plugin/calendar'
import { Pressable } from 'react-native'
import type { ReactNativeModalDateTimePickerProps } from 'react-native-modal-datetime-picker'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { useToggle } from 'react-use'

import { TextInput, useTheme } from '@audius/harmony-native'
import type { TextInputProps } from '@audius/harmony-native'

dayjs.extend(calendar)

type DateTimeModalProps = {
  date?: string
  onChange: (date: string) => void
  mode: ReactNativeModalDateTimePickerProps['mode']
  inputProps: TextInputProps
  dateTimeProps?: Partial<ReactNativeModalDateTimePickerProps>
}

export const DateTimeInput = (props: DateTimeModalProps) => {
  const { date, onChange, mode, inputProps, dateTimeProps } = props
  const { color, type } = useTheme()
  const [isDateTimeOpen, toggleDateTimeOpen] = useToggle(false)

  const handleChange = useCallback(
    (date: Date) => {
      onChange(date.toString())
      toggleDateTimeOpen()
    },
    [onChange, toggleDateTimeOpen]
  )

  const inputValue = date
    ? mode === 'date'
      ? dayjs(date).calendar(null, {
          sameDay: '[Today]',
          nextDay: '[Tomorrow]',
          nextWeek: 'dddd',
          lastDay: '[Yesterday]',
          lastWeek: '[Last] dddd',
          sameElse: 'M/D/YY' // This is where you format dates that don't fit in the above categories
        })
      : dayjs(date).format('h:mm A')
    : ''

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
          value={inputValue}
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
