const aaoErrorEmojis = {
  0: '😓',
  1: '😭',
  2: '😥',
  3: '😮',
  4: '😵‍💫',
  5: '😷',
  6: '😿',
  7: '🫤',
  8: '🙁',
  9: '🙄',
  10: '😣',
  11: '😦',
  12: '😔',
  13: '🫨',
  15: '🥴',
  16: '😬',
  18: '🤧',
  '-1': '🤨'
}
/**
 * Negative numbers are unexpected but valid, return last emoji.
 * Positive numbers are expected, return emoji at index of error code.
 * Positive numbers greater than total number of error codes are technically
 * invalid, but ignore them and return last emoji to avoid errors.
 **/
export const getAAOErrorEmojis = (errorCode: number): string => {
  return aaoErrorEmojis[errorCode] ?? aaoErrorEmojis[-1]
}
