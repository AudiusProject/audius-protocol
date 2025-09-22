import { ComponentType } from 'react'

import { AudioWei } from '@audius/fixed-decimal'

export type TokenValueSliderProps = {
  className?: string
  sliderClassName?: string
  sliderBarClassName?: string
  min: AudioWei
  max: AudioWei
  value: AudioWei
  minSliderWidth: number
  initialValue?: AudioWei
  isIncrease?: boolean
  minWrapper?: ComponentType<{ value: AudioWei }>
  maxWrapper?: ComponentType<{ value: AudioWei }>
}
