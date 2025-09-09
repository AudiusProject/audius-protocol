/**
 * Sanitizes numeric input by removing invalid characters but preserves the user's intended value
 */
export const sanitizeNumericInput = (input: string): string => {
  // Remove any non-numeric characters except decimal point
  const cleaned = input.replace(/[^0-9.]/g, '')

  // Handle multiple decimal points - keep only the first one
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('')
  }

  return cleaned
}
