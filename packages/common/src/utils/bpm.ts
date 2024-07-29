/**
 * Check if a bpm is valid
 * It should be a number with up to 3 digits before the decimal and up to 1 digit after the decimal
 */
export const isBpmValid = (bpm: string): boolean => {
  const regex = /^\d{0,3}(\.\d{0,1})?$/
  return regex.test(bpm)
}
