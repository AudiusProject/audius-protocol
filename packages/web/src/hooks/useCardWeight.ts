import { useEffect, useRef, useCallback, MutableRefObject } from 'react'

import { useInstanceVar } from '@audius/common/hooks'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { InterpolationChain, useSpring } from 'react-spring'

type Transform = {
  interpolate: InterpolationChain<unknown>
  getValue: () => unknown
}

// Calculates how drastically cursor-position changes over length will
// create skew
// See https://www.wolframalpha.com/input/?i=plot%5By+%3D+2.5+*+0.996+%5E+x%2C+y+%3D+5+*+0.990+%5E+x%5D+from+-1+to+800
const calculateSensitivity = (length: number) => 10 * Math.pow(0.994, length)

type UseCardWeightConfig = {
  sensitivity?: number
  isDisabled?: boolean
}

/**
 * `useCardWeight` will listen to the window scroll and output a translate value to be applied to an element.
 * @param sensitivity optional value to multiply the x-translation by to determine how to weight the
 *  perspective changes
 */
const useCardWeight = ({
  sensitivity,
  isDisabled
}: UseCardWeightConfig): [
  MutableRefObject<HTMLDivElement | null>,
  (moveConfig: { clientX: number; clientY: number }) => void,
  () => void,
  Transform
] => {
  const cardRef = useRef<HTMLDivElement | null>(null)

  const [getComputedSensitivityX, setComputedSensitivityX] = useInstanceVar(
    sensitivity || 0
  )
  const [getComputedSensitivityY, setComputedSensitivityY] = useInstanceVar(
    sensitivity || 0
  )

  useEffect(() => {
    if (!getComputedSensitivityX() && cardRef && cardRef.current) {
      // @ts-ignore
      const width = cardRef.current.offsetWidth
      setComputedSensitivityX(calculateSensitivity(width))
      // @ts-ignore
      const height = cardRef.current.offsetHeight
      setComputedSensitivityY(calculateSensitivity(height))
    }
  }, [
    sensitivity,
    cardRef,
    getComputedSensitivityX,
    setComputedSensitivityX,
    getComputedSensitivityY,
    setComputedSensitivityY
  ])

  const [{ xy }, set] = useSpring(() => ({ xy: [0, 0] }))
  // @ts-ignore
  const transform = xy.interpolate((x, y) => {
    return `perspective(400px) rotateY(${
      (x * getComputedSensitivityX()) / 60
    }deg) rotateX(${(-y * getComputedSensitivityY()) / 60}deg)`
  })

  // @ts-ignore
  const onMove = useCallback(
    ({ clientX: x, clientY: y }: { clientX: number; clientY: number }) => {
      if (cardRef.current && !isDisabled) {
        const { top, bottom, left, right } = (
          cardRef.current as any
        ).getBoundingClientRect()
        const width = right - left
        const height = bottom - top
        const offsetX = x - (left + width / 2)
        const offsetY = y - (top + height / 2)
        set({ xy: [offsetX, offsetY] })
      }
    },
    [set, isDisabled]
  )

  // @ts-ignore
  const onLeave = useCallback(() => {
    if (cardRef.current) {
      set({ xy: [0, 0] })
    }
  }, [set])

  useEffect(() => {
    if (isDisabled) {
      set({ xy: [0, 0] })
    }
  }, [set, isDisabled])

  return [cardRef, onMove, onLeave, transform]
}

export default useCardWeight
