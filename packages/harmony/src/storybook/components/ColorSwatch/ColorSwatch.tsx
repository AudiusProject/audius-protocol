import styled from '@emotion/styled'

import { Box, Flex, Text } from 'components'

type ColorSwatchProps = {
  name?: string
  desc?: string
  color: string
}

const Swatch = styled(Flex)({
  flex: '1 1 96px',
  maxWidth: '112px',
  background: 'var(--harmony-bg-white)',
  overflow: 'hidden'
})

const TileColor = styled(Box)({
  height: 'var(--harmony-unit-16)',
  borderBottom: '1px solid var(--harmony-border-strong)'
})

const InfoText = styled(Text)({
  textTransform: 'capitalize',
  lineHeight: 'var(--harmony-line-height-xs)'
})

export const ColorSwatch = ({ color, desc, name }: ColorSwatchProps) => {
  return (
    <Swatch direction='column' gap='s' border='strong' borderRadius='xl'>
      <TileColor style={{ background: color }} />
      <Flex direction='column' gap='xs' p='s'>
        {name ? (
          <InfoText variant='body' size='xs' color='default'>
            {name}
          </InfoText>
        ) : null}
        {desc ? (
          <InfoText variant='body' size='xs' color='default' strength='weak'>
            {desc}
          </InfoText>
        ) : null}
        <InfoText variant='body' size='xs' color='default' strength='weak'>
          {color}
        </InfoText>
      </Flex>
    </Swatch>
  )
}
