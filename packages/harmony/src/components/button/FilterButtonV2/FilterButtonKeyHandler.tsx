import { RefObject, useState, ReactNode, useEffect } from 'react'

import { FilterButtonOptionType } from './types'

type FilterButtonKeyHandlerProps<Value extends string> = {
  children: (activeValue: Value | null) => ReactNode
  disabled?: boolean
  onChange: (value: Value) => void
  optionRefs: RefObject<HTMLButtonElement[]>
  options: FilterButtonOptionType<Value>[]
  scrollRef: RefObject<HTMLDivElement>
}

/**
 * Handles key events for the popup inside the OptionsFilterButton component
 *
 * Calls the `children` function with the currently active value
 */
export const FilterButtonKeyHandler = <Value extends string>(
  props: FilterButtonKeyHandlerProps<Value>
) => {
  const { disabled, options, onChange, optionRefs, scrollRef, children } = props
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const activeValue = activeIndex !== null ? options[activeIndex]?.value : null

  useEffect(() => {
    const adjustScrollPosition = (newIndex: number | null) => {
      if (newIndex !== null) {
        if (optionRefs.current) {
          optionRefs.current[newIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      } else {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) {
        return
      }

      switch (event.key) {
        case 'ArrowUp':
          event.stopPropagation()
          event.preventDefault()
          setActiveIndex((prevIndex) => {
            const getNewIndex = () => {
              if (prevIndex === null) {
                return options.length - 1
              }

              return prevIndex > 0 ? prevIndex - 1 : null
            }

            const newIndex = getNewIndex()
            adjustScrollPosition(newIndex)

            return newIndex
          })
          break
        case 'ArrowDown':
          event.stopPropagation()
          event.preventDefault()
          setActiveIndex((prevIndex) => {
            const getNewIndex = () => {
              if (prevIndex === null) {
                return 0
              }

              return prevIndex < options.length - 1 ? prevIndex + 1 : null
            }

            const newIndex = getNewIndex()
            adjustScrollPosition(newIndex)

            return newIndex
          })
          break
        case 'Enter':
          event.stopPropagation()
          event.preventDefault()
          if (activeIndex !== null && options[activeIndex]) {
            onChange(options[activeIndex].value)
          }
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [disabled, options, activeIndex, scrollRef, optionRefs, onChange])

  return <>{children(activeValue)}</>
}
