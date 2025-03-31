import { useTheme } from '@emotion/react'
import { Unstyled } from '@storybook/blocks'

import {
  Flex,
  Paper,
  Text,
  TextSize,
  TextStrength,
  TextVariant
} from '~harmony/components'
import { variantStylesMap } from '~harmony/components/text'

type TypographyCardProps = {
  variant: TextVariant
  size: TextSize
  strength: TextStrength
}

export const TypographyCard = (props: TypographyCardProps) => {
  const { variant, size, strength } = props
  const { typography } = useTheme()

  // @ts-ignore
  const fontSize = typography.size[variantStylesMap[variant].fontSize[size]]
  const lineHeight =
    // @ts-ignore
    typography.lineHeight[variantStylesMap[variant].lineHeight[size]]
  // @ts-ignore
  const fontWeightKey = variantStylesMap[variant].fontWeight[strength]

  return (
    <Flex flex={1} direction='column' gap='l'>
      <Text tag='h4'>
        {variant}-{size}
        {strength ? `-${strength}` : ''}
      </Text>
      <Unstyled>
        <Text tag='p' {...props}>
          Ag
        </Text>
      </Unstyled>
      <Text>
        Font Size: {fontSize}px, Line-height: {lineHeight}, Spacing:{' '}
        {variant === 'label' ? '0.5px' : '0%'}, Weight: {fontWeightKey}
      </Text>
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
    <Flex direction='column' gap='3xl'>
      {sizes.map((size) => (
        <Paper p='2xl' shadow='near' gap='l' key={size}>
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
  )
}
