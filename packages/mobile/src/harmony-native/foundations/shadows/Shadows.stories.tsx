import type { Meta } from '@storybook/react-native'
import { ImageBackground } from 'react-native'

import { Text, Flex, Paper } from '@audius/harmony-native'
import shadowBackground from 'app/harmony-native/storybook/assets/shadowBackground.jpg'

const meta: Meta = {
  title: 'Foundation/Shadows',
  parameters: {
    controls: {
      include: ['w', 'h', 'backgroundColor', 'border', 'borderRadius', 'shadow']
    }
  }
}

export default meta

function ShadowLevel(props) {
  const { shadow, children, ...other } = props
  return (
    <Flex direction='column' gap='l' alignItems='center'>
      <Paper h={100} w={100} shadow={shadow} {...other}>
        {children}
        <Text>{shadow}</Text>
      </Paper>
    </Flex>
  )
}

export const Default = () => (
  <Flex justifyContent='space-between' gap='2xl'>
    <ShadowLevel shadow='near' />
    <ShadowLevel shadow='mid' />
    <ShadowLevel shadow='midInverted' />
    <ShadowLevel shadow='far' />
    <ShadowLevel shadow='emphasis' />
    <ShadowLevel shadow='special'>
      <Paper style={{ overflow: 'hidden' }}>
        <ImageBackground
          resizeMode='cover'
          style={{
            width: '100%',
            height: '100%'
          }}
          source={shadowBackground}
        />
      </Paper>
    </ShadowLevel>
  </Flex>
)
