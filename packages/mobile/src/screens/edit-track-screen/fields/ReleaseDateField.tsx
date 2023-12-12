import { useCallback, useMemo, useRef, useState } from 'react'

import type { Nullable } from '@audius/common'
import { Theme } from '@audius/common'
import { getTrack } from '@audius/common/dist/store/cache/tracks/selectors'
import { useField } from 'formik'
import moment from 'moment'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import type {
  CustomCancelButtonPropTypes,
  CustomConfirmButtonPropTypes
} from 'react-native-modal-datetime-picker'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { useSelector } from 'react-redux'

import { Button, ContextualMenu, Pill, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors, useThemeVariant } from 'app/utils/theme'

import { RemixTrackPill } from '../components/RemixTrackPill'

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

export const ReleaseDateField = (props) => {
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

  const renderValue = (releaseDateValue) => {
    return <Text>{releaseDateValue}</Text>
  }

  return (
    <ContextualMenu
      menuScreenName='ReleaseDate'
      label={messages.label}
      value={value}
      pillValue={value ? moment(value).format('M/D/YY @ h:mmA') : null}
      {...props}
    />
  )
}
