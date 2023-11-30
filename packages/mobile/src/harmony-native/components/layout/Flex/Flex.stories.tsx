import type { Meta, StoryObj } from '@storybook/react-native'

import { Text } from 'app/harmony-native/foundations'

import { Box } from '../Box/Box'

import { Flex } from './Flex'
import type { NativeFlexProps } from './types'

const meta: Meta<NativeFlexProps> = {
  title: 'Layout/Flex',
  component: Flex,
  parameters: {
    controls: { include: /^(alignItems|direction|gap|justifyContent|wrap)$/ }
  },
  args: {
    gap: 'm'
  },
  argTypes: {
    alignItems: {
      control: { type: 'select' },
      options: [
        'baseline',
        'flex-start',
        'center',
        'flex-end',
        'space-around',
        'space-between',
        'space-evenly'
      ]
    },
    justifyContent: {
      control: { type: 'select' },
      options: [
        'flex-start',
        'center',
        'flex-end',
        'space-around',
        'space-between',
        'space-evenly'
      ]
    },
    gap: {
      control: { type: 'select' },
      options: ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl']
    }
  },
  render: (props) => (
    <Flex border='strong' borderRadius='m' p='l' mb='xl' {...props}>
      <Box border='strong' borderRadius='s' p='s' ph='l'>
        <Text variant='display' size='s'>
          Box A
        </Text>
      </Box>
      <Box border='strong' borderRadius='s' p='s' ph='l'>
        <Text variant='display' size='s'>
          Box B
        </Text>
      </Box>
      <Box border='strong' borderRadius='s' p='s' ph='l'>
        <Text variant='display' size='s'>
          Box C
        </Text>
      </Box>
      <Box border='strong' borderRadius='s' p='s' ph='l'>
        <Text variant='display' size='s'>
          Box D
        </Text>
      </Box>
    </Flex>
  )
}

export default meta

type Story = StoryObj<NativeFlexProps>

export const Default: Story = {}

export const Centered: Story = {
  args: {
    alignItems: 'center'
  }
}

export const SpacedEvenly: Story = {
  args: {
    h: '100%',
    alignItems: 'center',
    justifyContent: 'space-evenly'
  }
}

export const Row: Story = {
  args: {
    direction: 'row'
  }
}
