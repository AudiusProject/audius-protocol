import { ChangeEvent, createContext } from 'react'

export type RadioGroupContextValue = {
  name?: string
  value?: string | null
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export const RadioGroupContext = createContext<
  RadioGroupContextValue | undefined
>(undefined)
