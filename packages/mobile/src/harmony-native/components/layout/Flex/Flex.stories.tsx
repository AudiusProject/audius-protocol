import type { Meta, StoryObj } from '@storybook/react-native'

import { Text } from 'app/harmony-native/foundations'

import { Flex } from './Flex'

const meta: Meta<typeof Flex> = {
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
    <Flex
      style={{ backgroundColor: 'rebeccapurple' }}
      border='strong'
      borderRadius='m'
      p='l'
      mb='xl'
      mh='s'
      {...props}
    >
      <Text>his</Text>
    </Flex>
  )
}

export default meta

type Story = StoryObj<typeof Flex>

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

export const Column: Story = {
  args: {
    direction: 'column'
  }
}
export const Row: Story = {
  args: {
    direction: 'row'
  }
}
