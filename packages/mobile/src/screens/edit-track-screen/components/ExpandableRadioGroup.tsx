import { Children } from 'react'

import type { RadioGroupProps } from '@audius/harmony-native'
import { Divider, RadioGroup } from '@audius/harmony-native'

type ExpandableRadioGroupProps = RadioGroupProps

export const ExpandableRadioGroup = (props: ExpandableRadioGroupProps) => {
  const { children, ...other } = props
  return (
    <RadioGroup pt='l' ph='xl' gap='xl' backgroundColor='white' {...other}>
      {Children.map(children, (child) => (
        <>
          {child}
          <Divider />
        </>
      ))}
    </RadioGroup>
  )
}
