import moment from 'moment'

export const formatToday = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const day = today.getDate()
  return `${year}-${month}-${day}`
}



export const getScheduledReleaseLabelMessage = (releaseDate, prefixMessage = '') => {

  const formatReleaseMessage = (releaseDate, base) => {
    const isFutureRelease = moment(releaseDate ?? undefined).isAfter(moment.now())
    console.log('asdf isFutureRelease: ', isFutureRelease)
    let message = isFutureRelease ? '[' + prefixMessage + '] ' : ''
    message += base;
    message += isFutureRelease ? ' @ LT' : '';
    return message
  }

  return moment(releaseDate ?? undefined)
    .calendar(null,
      {
        sameDay: formatReleaseMessage(releaseDate, '[Today] @ LT'),
        nextDay: formatReleaseMessage(releaseDate, '[Tomorrow] @ LT'),
        nextWeek: formatReleaseMessage(releaseDate, 'dddd'),
        lastDay: '[Yesterday]',
        lastWeek: '[Last] dddd',
        sameElse: formatReleaseMessage(releaseDate, 'MM/DD/YYYY')
      }
    )

}
