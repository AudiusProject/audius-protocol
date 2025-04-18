import type { ChangeEvent } from 'react'
import { useCallback, useRef } from 'react'

import { TextInput } from '@audius/harmony'
import type { TextInputProps } from '@audius/harmony'

/**
 * Formats and validates a time string input
 * Returns an object containing the formatted value and cursor position
 */
const formatTimeInput = (
  value: string,
  prevValue: string,
  selectionStart: number | null
) => {
  // Remove non-numeric characters
  const cleaned = value.replace(/\D/g, '')

  // Handle deletion
  if (value.length < prevValue.length && selectionStart !== null) {
    // If deleting the colon, remove the digit before it
    if (prevValue[selectionStart] === ':') {
      return {
        value: value.slice(0, selectionStart - 1) + value.slice(selectionStart),
        cursorPos: selectionStart - 1
      }
    }
    return { value, cursorPos: selectionStart }
  }

  // Handle empty input
  if (!cleaned) {
    return { value: '', cursorPos: 0 }
  }

  let hours = ''
  let minutes = ''
  let cursorPos = selectionStart

  // Parse hours and minutes based on input length
  if (cleaned.length <= 2) {
    // Handle 1 or 2 digits as hours
    hours = cleaned
    if (parseInt(hours, 10) > 12) {
      hours = hours[0]
      minutes = hours[1]
    }
  } else {
    // Handle 3 or more digits
    hours = cleaned.slice(0, 2)
    minutes = cleaned.slice(2, 4)

    // Validate hours
    if (parseInt(hours, 10) > 12) {
      hours = '12'
    }
  }

  // Format the time string
  let formatted = hours
  if (hours && (cleaned.length > 2 || value.includes(':'))) {
    // Only pad with zeros if we don't have any minute digits yet
    formatted += ':' + (minutes || '00')
  }

  // Adjust cursor position
  if (cursorPos !== null) {
    const hadColon = value.includes(':')
    const hasColon = formatted.includes(':')

    if (!hadColon && hasColon && cursorPos > hours.length) {
      // If we just added the colon and cursor was in minutes, adjust for the added colon
      cursorPos++
    } else if (
      formatted.length !== value.length &&
      cursorPos === value.length
    ) {
      // If we changed the length and cursor was at the end, move it to the end
      cursorPos = formatted.length
    }
  }

  return { value: formatted, cursorPos }
}

/**
 * Parses and validates a time string
 * Returns null if the time is invalid
 */
export const parseTime = (time: string) => {
  if (!time) return null
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const [, hours, minutes] = match
  const h = parseInt(hours, 10)
  const m = parseInt(minutes, 10)

  if (h < 1 || h > 12 || m < 0 || m > 59) return null

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

type TimeInputProps = Omit<TextInputProps, 'onChange' | 'onError'> & {
  value: string
  onChange: (value: string) => void
  onError?: (hasError: boolean) => void
}

export const TimeInput = ({
  value,
  onChange,
  onError,
  ...props
}: TimeInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const prevValueRef = useRef(value)

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target
      const selectionStart = input.selectionStart
      const { value: formatted, cursorPos } = formatTimeInput(
        input.value,
        prevValueRef.current,
        selectionStart
      )

      prevValueRef.current = formatted
      onChange(formatted)
      onError?.(!!formatted && !parseTime(formatted))

      // Set cursor position on next tick after React updates the input
      if (cursorPos !== null) {
        requestAnimationFrame(() => {
          input.setSelectionRange(cursorPos, cursorPos)
        })
      }
    },
    [onChange, onError]
  )

  return (
    <TextInput
      {...props}
      ref={inputRef}
      value={value}
      onChange={handleChange}
      // max length is 5 because largest time is 12:00
      maxLength={5}
    />
  )
}
