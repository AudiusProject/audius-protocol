import { useCallback, useMemo, useRef, useState } from 'react'

import { Theme } from '@audius/common/models'
import type { Nullable } from '@audius/common/utils'
import { useField } from 'formik'
import moment from 'moment'
import { TouchableOpacity } from 'react-native-gesture-handler'
import type {
  CustomCancelButtonPropTypes,
  CustomConfirmButtonPropTypes
} from 'react-native-modal-datetime-picker'
import DateTimePickerModal from 'react-native-modal-datetime-picker'

import { Button, Pill, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors, useThemeVariant } from 'app/utils/theme'

const isToday = (date: Date) => moment(date).isSame(moment(), 'day')

const messages = {
  label: 'Release Date',
  today: 'Today'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(2)
  },
  dateText: {
    textTransform: 'uppercase'
  },
  datePickerModal: {
    // Specific padding to hide the underlying "done" button with the "cancel" button
    paddingBottom: 37
  }
}))

const ConfirmDateButton = (props: CustomConfirmButtonPropTypes) => {
  const { label, onPress } = props
  return (
    <Button
      style={{ borderRadius: 0 }}
      variant='primary'
      size='large'
      title={label}
      fullWidth
      onPress={onPress}
      pressScale={1}
    />
  )
}

const CancelDateButton = (props: CustomCancelButtonPropTypes) => {
  const { label, onPress } = props
  return (
    <Button
      variant='commonAlt'
      size='large'
      title={label}
      fullWidth
      onPress={onPress}
    />
  )
}

export const ReleaseDateFieldLegacy = () => {
  const styles = useStyles()
  const [{ value, onChange }] = useField<Nullable<string>>('release_date')
  const [isOpen, setIsOpen] = useState(false)
  const { primary } = useThemeColors()
  const theme = useThemeVariant()
  const maximumDate = useRef(new Date())

  const releaseDate = useMemo(
    () => (value ? new Date(value) : new Date()),
    [value]
  )

  const handlePress = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleChange = useCallback(
    (selectedDate: Date) => {
      // This must be called first to prevent android date-picker
      // from showing up twice
      handleClose()
      const dateString = moment(selectedDate).toString()
      if (dateString) {
        onChange('release_date')(dateString)
      }
    },
    [onChange, handleClose]
  )

  return (
    <>
      <TouchableOpacity style={styles.root} onPress={handlePress}>
        <Text fontSize='large' weight='demiBold'>
          {messages.label}
        </Text>
        <Pill>
          <Text fontSize='small' weight='demiBold' style={styles.dateText}>
            {isToday(releaseDate)
              ? messages.today
              : moment(releaseDate).format('MM/DD/YY')}
          </Text>
        </Pill>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isOpen}
        date={releaseDate}
        mode='date'
        onConfirm={handleChange}
        onCancel={handleClose}
        display='inline'
        themeVariant={theme === Theme.DEFAULT ? 'light' : 'dark'}
        isDarkModeEnabled={theme !== Theme.DEFAULT}
        accentColor={primary}
        maximumDate={maximumDate.current}
        modalStyleIOS={styles.datePickerModal}
        customConfirmButtonIOS={ConfirmDateButton}
        customCancelButtonIOS={CancelDateButton}
      />
    </>
  )
}
