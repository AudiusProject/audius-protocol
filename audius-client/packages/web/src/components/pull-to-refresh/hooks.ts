import { useState, useEffect, useCallback } from 'react'

import { config, useSpring } from 'react-spring'

import useInstanceVar from 'common/hooks/useInstanceVar'
import {
  EnablePullToRefreshMessage,
  DisablePullToRefreshMessage
} from 'services/native-mobile-interface/android/pulltorefresh'
import { HapticFeedbackMessage } from 'services/native-mobile-interface/haptics'

type UseHasReachedTopPointProps = {
  fetchContent: () => void
  callback?: () => void
  cutoff: number
}

export const useHasReachedTopPoint = ({
  fetchContent,
  callback,
  cutoff
}: UseHasReachedTopPointProps) => {
  // Whether or not the user is touching the screen
  const [touchDown, setTouchDown] = useState(false)
  // What the scrollY was at the last touch down
  const [lastTouchDownY, setLastTouchDownY] = useState<number>(0)
  // Whether or not the user has overscrolled up high enough to trigger refresh
  const [hasReachedTopPoint, setHasReachedTopPoint] = useState(false)
  // Whether or not the fetchContent has fired or not
  const [hasFetched, setHasFetched] = useInstanceVar(false)

  const [springProps, setSpringProps] = useSpring(() => ({
    to: {
      y: 0
    },
    config: config.stiff,
    immediate: true
  }))

  // Track last touch down Y
  useEffect(() => {
    if (!touchDown) {
      const scrollY = window.scrollY
      setLastTouchDownY(scrollY)
    }
  }, [touchDown, setLastTouchDownY])

  // Handle scrolls. Either track the y value in spring or set overflow,
  // potentially sending haptic feedback.
  const handleScrollEvent = useCallback(() => {
    const scrollY = window.scrollY
    if (!hasReachedTopPoint) {
      setSpringProps({
        to: {
          y: scrollY
        }
      })
    }

    if (!hasReachedTopPoint && scrollY < cutoff && lastTouchDownY < 50) {
      setHasReachedTopPoint(true)
      const message = new HapticFeedbackMessage()
      message.send()
    }
  }, [
    hasReachedTopPoint,
    setHasReachedTopPoint,
    setSpringProps,
    cutoff,
    lastTouchDownY
  ])

  // Handle touch and scroll events
  const handleTouchStartEvent = useCallback(() => {
    setTouchDown(true)
  }, [setTouchDown])
  const handleTouchEndEvent = useCallback(() => {
    setTouchDown(false)
  }, [setTouchDown])

  useEffect(() => {
    window.addEventListener('scroll', handleScrollEvent)
    window.addEventListener('touchstart', handleTouchStartEvent)
    window.addEventListener('touchend', handleTouchEndEvent)

    return () => {
      window.removeEventListener('scroll', handleScrollEvent)
      window.removeEventListener('touchstart', handleTouchStartEvent)
      window.removeEventListener('touchend', handleTouchEndEvent)
    }
  }, [handleScrollEvent, handleTouchStartEvent, handleTouchEndEvent])

  // Actually fetchContent. Do it only when the user has reached
  // the top point and isn't touching down. Also make sure to only do it once.
  useEffect(() => {
    if (hasReachedTopPoint && !hasFetched() && !touchDown) {
      const fetchAsync = async () => {
        setHasFetched(true)
        await Promise.all([
          fetchContent(),
          new Promise(resolve => setTimeout(resolve, 1000))
        ])
        setSpringProps({
          to: {
            y: 0
          }
        })
        if (callback) callback()
        setHasReachedTopPoint(false)
        setHasFetched(false)
      }
      fetchAsync()
    }
  }, [
    fetchContent,
    callback,
    hasReachedTopPoint,
    hasFetched,
    touchDown,
    setHasFetched,
    setSpringProps
  ])

  return [hasReachedTopPoint, springProps, touchDown]
}

export const useAndroidPullToRefresh = (fetchContent: () => void) => {
  const [toggle, setToggle] = useState(false)
  const [getMessageId, setMessageId] = useInstanceVar<string | null>(null)

  useEffect(() => {
    const asyncEffect = async () => {
      const message = new EnablePullToRefreshMessage(getMessageId() !== null)
      message.send()
      const resp = await message.receive()
      setMessageId(resp.id)
      fetchContent()
      setToggle(!toggle)
    }
    asyncEffect()
  }, [fetchContent, toggle, setToggle, getMessageId, setMessageId])

  // Destroy on unmount
  useEffect(() => {
    return () => {
      new DisablePullToRefreshMessage(getMessageId()).send()
    }
  }, [getMessageId])
}
