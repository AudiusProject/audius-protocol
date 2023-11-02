import styled from '@emotion/styled'

import { Box, Flex, Text } from 'components'

const SwatchRoot = styled(Flex)(({ theme }) => ({
  flex: '1 1 96px',
  maxWidth: '112px',
  background: theme.color.background.white,
  overflow: 'hidden'
}))

const TileColor = styled(Box)(({ theme }) => ({
  height: theme.spacing.unit16,
  borderBottom: `1px solid ${theme.color.border.strong}`
}))

const InfoText = styled(Text)(({ theme }) => ({
  textTransform: 'capitalize',
  lineHeight: `${theme.typography.lineHeight.xs}px`
}))

type ColorSwatchProps = {
  name?: string
  desc?: string
  color: string
}

export const ColorSwatch = ({ color, desc, name }: ColorSwatchProps) => {
  return (
    <SwatchRoot direction='column' gap='s' border='strong' borderRadius='xl'>
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
    </SwatchRoot>
  )
}
