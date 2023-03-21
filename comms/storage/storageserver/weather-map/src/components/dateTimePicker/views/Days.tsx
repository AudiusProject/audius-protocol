import dayjs from 'dayjs'
import { useContext } from 'react'

import { DatePickerContext } from '../DatePickerProvider'

interface IDaysProps {
  start: dayjs.Dayjs
}

const Days = ({ start }: IDaysProps) => {
  const weekDays: string[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  const { selectedDate, selectingDate, changeSelectedDate } =
    useContext(DatePickerContext)
  return (
    <>
      <div className="mb-1 grid grid-cols-7">
        {weekDays.map((day, index) => (
          <span
            key={index}
            className="dow h-6 text-center text-sm font-medium leading-6 text-gray-500 dark:text-gray-400"
          >
            {day}
          </span>
        ))}
      </div>
      <div className="grid w-64 grid-cols-7">
        {[...Array(42)].map((_date, index) => {
          const current = start.add(index, 'day')
          return (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <span
              key={index}
              className={`block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9 hover:bg-gray-100 dark:hover:bg-gray-600 ${
                current.month() === selectedDate.month() &&
                current.year() === selectedDate.year() &&
                current.date() === selectedDate.date()
                  ? 'bg-purple-700 text-white hover:bg-purple-600' // selected date - highlighted colors
                  : current.month() === selectingDate.month() &&
                    current.year() === selectingDate.year()
                  ? 'text-gray-800 dark:text-white' // current month - enabled colors
                  : 'text-gray-500 dark:text-gray-400' // other month - disabled colors
              } 
                            `}
              onClick={() => changeSelectedDate(current)}
            >
              {current.date()}
            </span>
          )
        })}
      </div>
    </>
  )
}

export default Days
