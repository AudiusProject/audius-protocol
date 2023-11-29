import type { Meta } from '@storybook/react-native'

import { Flex } from 'app/harmony-native/components/layout/Flex/Flex'
import { Paper } from 'app/harmony-native/components/layout/Paper/Paper'

import { Text } from '../typography'

const meta: Meta = {
  title: 'Foundations/Layout/Shadows',
  parameters: {
    controls: {
      include: ['w', 'h', 'backgroundColor', 'border', 'borderRadius', 'shadow']
    }
  }
}

export default meta

function ShadowLevel(props) {
  const { shadow, ...other } = props
  return (
    <Flex direction='column' gap='l' alignItems='center'>
      <Paper h={80} w={80} shadow={shadow} {...other} />
      <Text>{shadow}</Text>
    </Flex>
  )
}

export const Default = () => (
  <Flex justifyContent='space-between'>
    <ShadowLevel shadow='near' />
    <ShadowLevel shadow='mid' />
    <ShadowLevel shadow='midInverted' />
    <ShadowLevel shadow='far' />
    <ShadowLevel shadow='emphasis' />
    {/* <ShadowLevel
      shadow='special'
      css={{
        background: `url(${shadowBackground}), lightgray 50%`,
        backgroundSize: 'cover'
      }}
    /> */}
  </Flex>
)
