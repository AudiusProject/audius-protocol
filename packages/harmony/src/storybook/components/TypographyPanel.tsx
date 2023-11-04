import { Unstyled } from '@storybook/blocks'

import {
  Flex,
  Paper,
  Text,
  TextSize,
  TextStrength,
  TextVariant
} from 'components'

type TypographyCardProps = {
  variant: TextVariant
  size: TextSize
  strength: TextStrength
}

export const TypographyCard = (props: TypographyCardProps) => {
  const { variant, size, strength } = props
  return (
    <Flex flex={1} direction='column' gap='l'>
      <Text>
        {variant}-{size}
        {strength ? `-${strength}` : ''}
      </Text>
      <Text {...props}>Ag</Text>
    </Flex>
  )
}

type TypographyPanelProps = {
  variant: TextVariant
  sizes: TextSize[]
  strengths: TextStrength[]
}

export const TypographyPanel = (props: TypographyPanelProps) => {
  const { variant, sizes, strengths } = props

  return (
    <Unstyled>
      <Flex direction='column' gap='3xl'>
        {sizes.map((size) => (
          <Paper p='2xl' shadow='near' key={size}>
            {strengths.map((strength) => (
              <TypographyCard
                key={strength}
                variant={variant}
                size={size}
                strength={strength}
              />
            ))}
          </Paper>
        ))}
      </Flex>
    </Unstyled>
  )
}
