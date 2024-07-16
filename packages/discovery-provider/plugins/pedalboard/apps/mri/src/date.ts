const padToTwoDigits = (num: number) => {
  return num.toString().padStart(2, '0')
}

/**
 * Formats date to YYYYMMDDhhmmss
 * @returns string date
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = padToTwoDigits(date.getMonth() + 1)
  const day = padToTwoDigits(date.getDate())
  const hours = padToTwoDigits(date.getHours())
  const minutes = padToTwoDigits(date.getMinutes())
  const seconds = padToTwoDigits(date.getSeconds())

  // Concatenate all components in the specified format
  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

/**
 * Gets YYYYMM from a given date
 * @returns string date
 */
export const getYearMonth = (date: Date): string => {
  const year = date.getFullYear()
  const month = padToTwoDigits(date.getMonth() + 1)
  return `${year}${month}`
}
