export const getIsIOS = () => {
  return !/android/i.test(navigator.userAgent)
}
