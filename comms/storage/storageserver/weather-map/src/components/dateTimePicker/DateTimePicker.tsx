import dayjs from 'dayjs'
import { ReactElement, useContext, useEffect, useRef } from 'react'

import DatePickerPopup from './DatePickerPopup'
import DatePickerProvider, { DatePickerContext } from './DatePickerProvider'

export interface IDatePickerProps {
  children?: ReactElement
  onChange: (date: dayjs.Dayjs) => void
  show: boolean
  setShow: (show: boolean) => void
  classNames?: string
  defaultDate: dayjs.Dayjs
}

const DateTimePicker = ({
  children,
  onChange,
  show,
  setShow,
  defaultDate,
}: IDatePickerProps) => (
  <div className="w-fit-content">
    <DatePickerProvider
      onChange={onChange}
      show={show}
      setShow={setShow}
      defaultDate={defaultDate}
    >
      <DatePickerMain>{children}</DatePickerMain>
    </DatePickerProvider>
  </div>
)

const DatePickerMain = ({ children }: { children?: ReactElement }) => {
  const {
    setShow,
    show,
    selectedDateString,
    changeSelectedDateString,
    finishChangingSelectedDateString,
  } = useContext(DatePickerContext)
  const inputRef = useRef<HTMLInputElement>(null)
  const datePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(inputRef?.current && datePickerRef?.current)) return
      if (
        !inputRef.current.contains(event.target as Node) &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShow(false)
      }
    }

    document.addEventListener('mousedown', (event) => handleClickOutside(event))

    return () => {
      document.removeEventListener('mousedown', (event) => handleClickOutside(event))
    }
  }, [datePickerRef, inputRef, setShow])

  return (
    <>
      {children ? (
        { ...children }
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <button onClick={() => setShow(true)}>
              <CalendarIcon />
            </button>
          </div>
          <input
            ref={inputRef}
            type="string"
            name="date"
            id="date"
            className={`w-fit-content block rounded-lg border bg-gray-50 py-2.5 pl-9 text-sm text-gray-900 outline-none focus:border-purple-500 focus-visible:border-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 ${
              dayjs(selectedDateString).isValid() ? 'border-gray-300' : 'border-red-500'
            }`}
            placeholder="YYYY-MM-DD hh:mm (AM/PM)"
            value={selectedDateString}
            onChange={(e) => {
              changeSelectedDateString(e.target.value)
            }}
            onBlur={() => finishChangingSelectedDateString()}
          />
        </div>
      )}
      {show && <DatePickerPopup ref={datePickerRef} />}
    </>
  )
}

const CalendarIcon = () => {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 text-gray-500 dark:text-gray-400"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
        clipRule="evenodd"
      ></path>
    </svg>
  )
}

export default DateTimePicker
