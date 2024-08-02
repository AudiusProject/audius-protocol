import { Children } from 'react'

import { ScrollView } from 'react-native'

import type { RadioGroupProps } from '@audius/harmony-native'
import { Divider, RadioGroup } from '@audius/harmony-native'

type ExpandableRadioGroupProps = RadioGroupProps

export const ExpandableRadioGroup = (props: ExpandableRadioGroupProps) => {
  const { children, ...other } = props
  const childCount = Children.count(children)
  return (
    <ScrollView>
      <RadioGroup pt='l' ph='xl' gap='xl' backgroundColor='white' {...other}>
        {Children.map(children, (child, index) => (
          <>
            {child}
            {child && index !== childCount - 1 ? <Divider /> : null}
          </>
        ))}
      </RadioGroup>
    </ScrollView>
  )
}
