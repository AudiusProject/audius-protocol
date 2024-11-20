import { useCallback, useState } from 'react'

import dayjs from 'dayjs'
import { Pressable } from 'react-native'
import type { ReactNativeModalDateTimePickerProps } from 'react-native-modal-datetime-picker'
import DateTimePickerModal from 'react-native-modal-datetime-picker'

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
  const [isDateTimeOpen, setIsDateTimeOpen] = useState(false)

  const openDateTime = useCallback(() => {
    setIsDateTimeOpen(true)
  }, [setIsDateTimeOpen])

  const closeDateTime = useCallback(() => {
    setIsDateTimeOpen(false)
  }, [setIsDateTimeOpen])

  const handleChange = useCallback(
    (date: Date) => {
      date.setHours(0, 0, 0, 0)
      onChange(date.toString())
      setIsDateTimeOpen((d) => !d)
    },
    [onChange, setIsDateTimeOpen]
  )

  const dateProps: Partial<ReactNativeModalDateTimePickerProps> = {
    display: 'inline',
    accentColor: color.primary.primary,
    themeVariant: type === 'day' ? 'light' : 'dark',
    isDarkModeEnabled: type !== 'day'
  }

  return (
    <>
      <Pressable onPress={openDateTime}>
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
        onCancel={closeDateTime}
        {...(mode === 'date' ? dateProps : {})}
      />
    </>
  )
}
