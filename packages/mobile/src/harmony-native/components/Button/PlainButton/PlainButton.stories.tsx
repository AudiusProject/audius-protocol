import type { Meta, StoryObj } from '@storybook/react-native'

import { IconHeart } from '@audius/harmony-native'

import { Box } from '../../layout/Box/Box'
import { Flex } from '../../layout/Flex/Flex'

import { PlainButton } from './PlainButton'
import type { PlainButtonProps } from './types'

const meta: Meta<PlainButtonProps> = {
  title: 'Components/Button/PlainButton',
  component: PlainButton,
  args: {
    iconLeft: IconHeart
  }
}

export default meta

type Story = StoryObj<PlainButtonProps>

export const Variants: Story = {
  render: (props) => (
    <Flex>
      <Box p='xl'>
        <PlainButton {...props} variant='default'>
          Button
        </PlainButton>
      </Box>
      <Box p='xl'>
        <PlainButton {...props} variant='subdued'>
          Button
        </PlainButton>
      </Box>
      <Box p='xl' style={{ backgroundColor: '#32334d' }}>
        <PlainButton {...props} variant='inverted'>
          Button
        </PlainButton>
      </Box>
    </Flex>
  )
}

export const Sizes: Story = {
  render: (props) => (
    <Flex>
      <Box p='xl'>
        <PlainButton {...props} size='default'>
          Button
        </PlainButton>
      </Box>
      <Box p='xl'>
        <PlainButton {...props} size='large'>
          Button
        </PlainButton>
      </Box>
    </Flex>
  )
}
