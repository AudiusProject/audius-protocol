import { useContext } from 'react'

import { DatePickerContext, Views } from './DatePickerProvider'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
export const ButtonPrevMonth = () => {
  const { selectingDate, changeSelectingDate, view } = useContext(DatePickerContext)
  return (
    <button
      type="button"
      className="rounded-lg bg-white p-2.5 text-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:hover:text-white"
      onClick={() =>
        changeSelectingDate(selectingDate.subtract(1, view === 'days' ? 'month' : 'year'))
      }
    >
      <svg
        className="h-4 w-4"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
          clipRule="evenodd"
        ></path>
      </svg>
    </button>
  )
}

export const ButtonSelectMonth = () => {
  const { selectingDate, view, setView } = useContext(DatePickerContext)

  const calculateView = (): Views => {
    if (view === 'days') return 'months'
    return view
  }

  return (
    <button
      type="button"
      className="rounded-lg bg-white py-2.5 px-5 text-sm font-semibold text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
      onClick={() => setView(calculateView())}
    >
      {view === 'days' && (
        <>
          {MONTH_NAMES[selectingDate.month()]} {selectingDate.year()}
        </>
      )}
      {view === 'months' && selectingDate.year()}
    </button>
  )
}

export const ButtonNextMonth = () => {
  const { selectingDate, changeSelectingDate, view } = useContext(DatePickerContext)
  return (
    <button
      type="button"
      className="rounded-lg bg-white p-2.5 text-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:hover:text-white"
      onClick={() =>
        changeSelectingDate(selectingDate.add(1, view === 'days' ? 'month' : 'year'))
      }
    >
      <svg
        className="h-4 w-4"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
          clipRule="evenodd"
        ></path>
      </svg>
    </button>
  )
}
