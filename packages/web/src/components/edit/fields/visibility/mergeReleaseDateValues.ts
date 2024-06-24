import moment from 'moment'

export const mergeReleaseDateValues = (
  day: string,
  time: string,
  meridian: string
) => {
  const truncatedReleaseDate = moment(day).startOf('day')
  const hour = parseInt(time.split(':')[0])
  let adjustedHours = hour

  if (meridian === 'PM' && hour < 12) {
    adjustedHours += 12
  } else if (meridian === 'AM' && hour === 12) {
    adjustedHours = 0
  }
  const combinedDateTime = truncatedReleaseDate
    .add(adjustedHours, 'hours')
    .add(time.split(':')[1], 'minutes')

  return combinedDateTime
}
