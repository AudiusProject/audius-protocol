export const formatNumberCommas = (num) => {
  const parts = num.toString().split('.')
  return (
    parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    (parts[1] ? '.' + parts[1] : '')
  )
}

export const formatPrice = (num) => {
  return formatNumberCommas((num / 100).toFixed(2))
}
