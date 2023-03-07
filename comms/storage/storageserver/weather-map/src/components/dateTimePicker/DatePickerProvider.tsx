/* eslint-disable @typescript-eslint/no-empty-function */
import dayjs from 'dayjs'
import {
  createContext,
  Dispatch,
  ReactElement,
  SetStateAction,
  useEffect,
  useState,
} from 'react'

const FORMAT = 'YYYY-MM-DD hh:mm A'

interface IDatePickerContext {
  view: Views
  setView: Dispatch<SetStateAction<Views>>
  show: boolean
  setShow: (show: boolean) => void
  selectedDate: dayjs.Dayjs // Valid date selected
  selectingDate: dayjs.Dayjs // Viewing to select - not actually confirmed selected yet
  changeSelectedDate: (date: dayjs.Dayjs) => void
  changeSelectingDate: (date: dayjs.Dayjs) => void
  selectedDateString: string // String displayed in input field - user can change so it may be invalid temporarily
  changeSelectedDateString: (newDateStr: string) => void
  finishChangingSelectedDateString: () => void
}

export type Views = 'days' | 'months'

export const DatePickerContext = createContext<IDatePickerContext>({
  view: 'days',
  setView: () => {},
  show: false,
  setShow: () => {},
  selectedDate: dayjs(),
  selectingDate: dayjs(),
  changeSelectedDate: () => {},
  changeSelectingDate: () => {},
  selectedDateString: '',
  changeSelectedDateString: () => {},
  finishChangingSelectedDateString: () => {},
})

interface IDatePickerProviderProps {
  children: ReactElement
  onChange: (date: dayjs.Dayjs) => void
  show: boolean
  setShow: (show: boolean) => void
  defaultDate: dayjs.Dayjs
}

const DatePickerProvider = ({
  children,
  onChange,
  show,
  setShow,
  defaultDate,
}: IDatePickerProviderProps) => {
  const [view, setView] = useState<Views>('days')
  const [selectingDate, setSelectingDate] = useState<dayjs.Dayjs>(defaultDate)
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(defaultDate)
  const [selectedDateString, setSelectedDateString] = useState<string>('')

  useEffect(() => {
    changeSelectedDate(selectedDate)
  }, [])

  useEffect(() => {
    const formattedDate = selectedDate.format(FORMAT)
    if (selectedDateString !== formattedDate) {
      setSelectedDateString(formattedDate)
    }
    onChange(selectedDate)
    setShow(false)
  }, [selectedDate])

  const changeSelectedDate = (date: dayjs.Dayjs) => {
    // Keep the same hours and minutes when changing selectedDate
    const newDate = date.hour(selectedDate.hour()).minute(selectedDate.minute())
    setSelectingDate(newDate)
    setSelectedDate(newDate)
  }

  const changeSelectedDateString = (newDateStr: string) => {
    setSelectedDateString(newDateStr)
  }

  const finishChangingSelectedDateString = () => {
    // Only update our selected date if the new date string is valid and new
    const newSelectedDate = dayjs(selectedDateString)
    if (newSelectedDate.isValid() && selectedDateString !== selectedDate.format(FORMAT)) {
      setSelectingDate(newSelectedDate)
      setSelectedDate(newSelectedDate)
    }
  }

  const changeSelectingDate = (date: dayjs.Dayjs) => {
    // Keep the same hours and minutes as selectedDate when selecting new date
    setSelectingDate(date.hour(selectedDate.hour()).minute(selectedDate.minute()))
  }

  return (
    <DatePickerContext.Provider
      value={{
        view,
        setView,
        show,
        setShow,
        selectedDate,
        changeSelectedDate,
        selectingDate,
        changeSelectingDate,
        selectedDateString,
        changeSelectedDateString,
        finishChangingSelectedDateString,
      }}
    >
      {children}
    </DatePickerContext.Provider>
  )
}

export default DatePickerProvider
