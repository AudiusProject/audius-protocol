import type { ReactElement, ReactNode } from 'react'

import { Flex, Text, TextLink } from '@audius/harmony-native'

export type MetadataItemProps = {
  label: string
  value: string
  url?: string
  renderValue?: (value: string, link: ReactElement) => ReactNode
}

export const MetadataItem = (props: MetadataItemProps) => {
  const { label, value, url, renderValue: renderValueProp } = props

  const renderValue = () => {
    const valueElement = url ? (
      <TextLink url={url} variant='visible' size='s' strength='strong'>
        {value}
      </TextLink>
    ) : (
      <Text size='s' strength='strong'>
        {value}
      </Text>
    )

    if (renderValueProp) {
      return renderValueProp(value, valueElement)
    } else {
      return valueElement
    }
  }

  return (
    <Flex direction='row' alignItems='center' gap='xs'>
      <Text variant='label' color='subdued'>
        {label}
      </Text>
      {renderValue()}
    </Flex>
  )
}
