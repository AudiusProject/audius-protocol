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
  if (cleaned.length === 1) {
    // Single digit - treat as hour
    hours = cleaned
  } else if (cleaned.length === 2) {
    // Two digits - if valid hour, treat as hour, otherwise split
    const num = parseInt(cleaned, 10)
    if (num <= 12) {
      hours = cleaned
    } else {
      hours = cleaned[0]
      minutes = cleaned[1]
    }
  } else {
    // Three or more digits
    if (
      parseInt(cleaned[0], 10) > 1 ||
      (cleaned.length > 3 && parseInt(cleaned.slice(0, 2), 10) > 12)
    ) {
      // If first digit > 1 or first two digits > 12, treat first digit as hour
      hours = cleaned[0]
      minutes = cleaned.slice(1, 3)
    } else {
      // Otherwise take first two digits as hours if possible
      hours = cleaned.slice(0, 2)
      minutes = cleaned.slice(2, 4)
      if (parseInt(hours, 10) > 12) {
        hours = hours[0]
        minutes = cleaned.slice(1, 3)
      }
    }
  }

  // Format the time string
  let formatted = hours
  if (hours && (cleaned.length > hours.length || value.includes(':'))) {
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
    />
  )
}
