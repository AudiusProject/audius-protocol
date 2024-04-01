import dayjs, { Dayjs } from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import duration from 'dayjs/plugin/duration'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(advancedFormat)
dayjs.extend(duration)

export default dayjs
export { Dayjs }
