const aaoErrorEmojis = [
  '😓',
  '😭',
  '😥',
  '😮',
  '🤬',
  '😷',
  '😿',
  '😤',
  '🙁',
  '🤨'
]

/**
 * Negative numbers are unexpected but valid, return last emoji.
 * Positive numbers are expected, return emoji at index of error code.
 * Positive numbers greater than total number of error codes are technically
 * invalid, but ignore them and return last emoji to avoid errors.
 **/
export const getAAOErrorEmojis = (errorCode: number): string => {
  return aaoErrorEmojis[errorCode] ?? aaoErrorEmojis[aaoErrorEmojis.length - 1]
}
