import { ReactNode } from 'react'

import { Flex, Text } from '@audius/harmony'

import { TextLink } from 'components/link'
import { useIsMobile } from 'hooks/useIsMobile'

type MetadataItemProps = {
  label: string
  value: string
  url?: string
  renderValue?: (value: string) => ReactNode
}

export const MetadataItem = (props: MetadataItemProps) => {
  const isMobile = useIsMobile()
  const { label, value, url, renderValue: renderValueProp } = props

  const renderValue = () => {
    const valueElement = renderValueProp ? renderValueProp(value) : value

    return url ? (
      <TextLink
        to={url}
        variant={isMobile ? 'visible' : 'default'}
        size='s'
        strength='strong'
      >
        {valueElement}
      </TextLink>
    ) : (
      <Text size='s' strength='strong'>
        {valueElement}
      </Text>
    )
  }

  return (
    <Flex direction='row' alignItems='center' gap='xs'>
      <Text tag='dt' variant='label' color='subdued'>
        {label}
      </Text>
      <dd>{renderValue()}</dd>
    </Flex>
  )
}
