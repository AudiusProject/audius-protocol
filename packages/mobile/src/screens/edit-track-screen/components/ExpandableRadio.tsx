import type { ReactNode } from 'react'
import { useContext } from 'react'

import type { RadioProps } from '@audius/harmony-native'
import { Radio, RadioGroupContext, Text } from '@audius/harmony-native'

type ExpandableRadioProps = RadioProps & {
  description?: string
  checkedContent?: ReactNode
}

export const ExpandableRadio = (props: ExpandableRadioProps) => {
  const { description, checkedContent, ...radioProps } = props
  const { value } = radioProps
  const { value: currentValue } = useContext(RadioGroupContext)
  const checked = value === currentValue

  return (
    <Radio size='large' {...radioProps}>
      {checked ? (
        <>
          {description ? <Text>{description}</Text> : null}
          {checkedContent || null}
        </>
      ) : null}
    </Radio>
  )
}
