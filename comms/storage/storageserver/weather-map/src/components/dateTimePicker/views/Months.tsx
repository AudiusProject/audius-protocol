import dayjs from 'dayjs'
import { useContext } from 'react'

import { DatePickerContext } from '../DatePickerProvider'

const MONTH_NAMES_ABBREV = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const Months = () => {
  const { selectingDate, changeSelectingDate, setView } = useContext(DatePickerContext)
  return (
    <div className="grid w-64 grid-cols-4">
      {[...Array(12)].map((_month, index) => {
        const current = dayjs(selectingDate).month(index)
        return (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <span
            key={index}
            className={`block flex-1 cursor-pointer rounded-lg border-0 text-center text-sm font-semibold leading-9  text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600 ${
              selectingDate.month() === current.month()
                ? 'bg-purple-700 text-white hover:bg-purple-600'
                : ''
            }`}
            onClick={() => {
              changeSelectingDate(current)
              setView('days')
            }}
          >
            {MONTH_NAMES_ABBREV[index]}
          </span>
        )
      })}
    </div>
  )
}

export default Months
