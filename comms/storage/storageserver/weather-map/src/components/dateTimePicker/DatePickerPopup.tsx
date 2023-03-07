import { ForwardedRef, forwardRef, useContext } from 'react'

import { ButtonNextMonth, ButtonPrevMonth, ButtonSelectMonth } from './Buttons'
import { DatePickerContext } from './DatePickerProvider'
import Days from './views/Days'
import Months from './views/Months'

const DatePickerPopup = forwardRef<HTMLDivElement>(
  (_props, ref: ForwardedRef<HTMLDivElement>) => {
    const { selectingDate, view } = useContext(DatePickerContext)

    // Find the first monday before firstOfMonth, including if firstOfMonth is a monday
    const firstOfMonth = selectingDate.startOf('month')
    const startDay = firstOfMonth.day() === 0 ? 7 : firstOfMonth.day()
    const start = firstOfMonth.subtract(startDay - 1, 'day')

    return (
      <div ref={ref} className="absolute top-10 z-50 block pt-2">
        <div className="inline-block rounded-lg bg-white p-4 shadow-lg dark:bg-gray-700">
          <div>
            <div className="mb-2 flex justify-between">
              <ButtonPrevMonth />
              <ButtonSelectMonth />
              <ButtonNextMonth />
            </div>
          </div>
          <div className="p-1">
            {view === 'days' && <Days start={start} />}
            {view === 'months' && <Months />}
          </div>
        </div>
      </div>
    )
  },
)
DatePickerPopup.displayName = 'DatePickerPopup'

export default DatePickerPopup
