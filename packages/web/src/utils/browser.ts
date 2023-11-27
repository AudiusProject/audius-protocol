export const getIsIOS = () => {
  return (
    typeof navigator !== 'undefined' && !/android/i.test(navigator.userAgent)
  )
}
