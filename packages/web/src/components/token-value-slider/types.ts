import BN from 'bn.js'

export type TokenValueSliderProps = {
  className?: string
  sliderClassName?: string
  sliderBarClassName?: string
  min: BN
  max: BN
  value: BN
  minSliderWidth: number
  initialValue?: BN
  isIncrease?: boolean
  minWrapper?: React.ComponentType<{ value: BN }>
  maxWrapper?: React.ComponentType<{ value: BN }>
}
