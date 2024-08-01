export const BPM_REGEX = /^\d{0,3}(\.\d{0,2})?$/
/**
 * Check if a bpm is valid
 * It should be a string containing number with up to 3 digits before the decimal and
 * up to 2 digits after the decimal
 */
export const isBpmValid = (bpm: string): boolean => {
  const regex = BPM_REGEX
  return regex.test(bpm)
}
