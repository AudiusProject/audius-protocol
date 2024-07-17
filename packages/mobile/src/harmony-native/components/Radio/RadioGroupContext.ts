import { createContext } from 'react'

export type RadioGroupContextValue = {
  value?: string | null
  onValueChange: (value: string) => void
}

export const RadioGroupContext = createContext<RadioGroupContextValue>({
  value: undefined,
  onValueChange: () => {}
})
