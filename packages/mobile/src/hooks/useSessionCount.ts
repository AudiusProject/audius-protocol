import AsyncStorage from '@react-native-community/async-storage'
import { useEffect, useState } from 'react'

const SESSION_COUNT_KEY = '@session-count'

const getSessionCount = async () => {
  const sessionCount = await AsyncStorage.getItem(SESSION_COUNT_KEY)
  return sessionCount ? parseInt(sessionCount, 10) : 0
}

export const incrementSessionCount = async () => {
  const sessionCount = await getSessionCount()
  await AsyncStorage.setItem(SESSION_COUNT_KEY, (sessionCount + 1).toString())
}

/**
 * Invokes `callback` every `frequency` sessions
 * @param callback
 * @param frequency
 * @param startAt which session to start at
 */
const useSessionCount = (
  callback: () => void,
  frequency: number,
  startAt = 1
) => {
  // Memoize each time the callback is invoked to guard against callback
  // being redefined each rerender and over triggering
  const [calledAtCount, setCalledAtCount] = useState<number | null>(null)

  useEffect(() => {
    const work = async () => {
      const count = await getSessionCount()
      if (
        count &&
        count >= startAt &&
        count % frequency === 0 &&
        count !== calledAtCount
      ) {
        callback()
        setCalledAtCount(count)
      }
    }
    work()
  }, [callback, calledAtCount, setCalledAtCount, frequency, startAt])
}

export default useSessionCount
