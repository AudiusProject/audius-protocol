import { FixedDecimal } from '@audius/fixed-decimal'

export type TokenValueSliderProps = {
  className?: string
  sliderClassName?: string
  sliderBarClassName?: string
  min: FixedDecimal
  max: FixedDecimal
  value: FixedDecimal
  minSliderWidth: number
  initialValue?: FixedDecimal
  isIncrease?: boolean
  minWrapper?: React.ComponentType<{ value: FixedDecimal }>
  maxWrapper?: React.ComponentType<{ value: FixedDecimal }>
}
