import { PlainButtonSize } from '@audius/harmony'
import type { Meta, StoryObj } from '@storybook/react-native'

import { IconHeart } from '@audius/harmony-native'

import { Box } from '../../layout/Box/Box'
import { Flex } from '../../layout/Flex/Flex'
import type { PlainButtonProps } from '../types'
import { PlainButtonType } from '../types'

import { PlainButton } from './PlainButton'

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
        <PlainButton {...props} variant={PlainButtonType.DEFAULT}>
          Button
        </PlainButton>
      </Box>
      <Box p='xl'>
        <PlainButton {...props} variant={PlainButtonType.SUBDUED}>
          Button
        </PlainButton>
      </Box>
      <Box p='xl' style={{ backgroundColor: '#32334d' }}>
        <PlainButton {...props} variant={PlainButtonType.INVERTED}>
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
        <PlainButton {...props} size={PlainButtonSize.DEFAULT}>
          Button
        </PlainButton>
      </Box>
      <Box p='xl'>
        <PlainButton {...props} size={PlainButtonSize.LARGE}>
          Button
        </PlainButton>
      </Box>
    </Flex>
  )
}
