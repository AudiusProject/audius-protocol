import { initialMode, eventEmitter } from 'react-native-dark-mode'

let prefersDarkMode = initialMode === 'dark'

export const getInitialDarkModePreference = () => {
  return initialMode === 'dark'
}

export const getPrefersDarkModeChange = async () => {
  let listener
  const prefers = await new Promise(resolve => {
    listener = (newMode: any) => {
      prefersDarkMode = newMode === 'dark'
      resolve(prefersDarkMode)
    }
    eventEmitter.on('currentModeChanged', listener)
  })
  if (listener) {
    eventEmitter.removeListener('currentModeChanged', listener)
  }
  return prefers
}
