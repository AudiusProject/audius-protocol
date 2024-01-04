import type { Meta, StoryObj } from '@storybook/react-native'

import { IconHeart } from '@audius/harmony-native'

import { Flex } from '../../layout/Flex/Flex'
import type { ButtonProps } from '../types'
import { ButtonSize, ButtonType } from '../types'

import { Button } from './Button'

const meta: Meta<ButtonProps> = {
  title: 'Components/Button/Button',
  component: Button,
  argTypes: {
    isLoading: {
      description: 'Loading State',
      control: {
        type: 'boolean'
      }
    },
    isStaticIcon: {
      description: 'Do not override icon fill color',
      control: {
        type: 'boolean'
      }
    },
    fullWidth: {
      description: 'Full Width',
      control: {
        type: 'boolean'
      }
    },
    disabled: {
      description: 'Disabled',
      control: {
        type: 'boolean'
      }
    }
  },
  args: {
    iconLeft: IconHeart
  },
  render: (props) => (
    <Flex p='l' gap='l'>
      <Button {...props} variant={ButtonType.PRIMARY}>
        Primary
      </Button>
      <Button {...props} variant={ButtonType.SECONDARY}>
        Secondary
      </Button>
      <Button {...props} variant={ButtonType.TERTIARY}>
        Tertiary
      </Button>
      <Button {...props} variant={ButtonType.DESTRUCTIVE}>
        Destructive
      </Button>
    </Flex>
  )
}

export default meta

type Story = StoryObj<ButtonProps>

export const Default: Story = {}

export const Loading: Story = {
  args: {
    isLoading: true
  }
}

export const Disabled: Story = {
  args: {
    disabled: true
  }
}

export const OverrideColor: Story = {
  render: (props) => (
    <Flex p='l' gap='l'>
      <Button {...props} color='blue' variant={ButtonType.PRIMARY}>
        Color
      </Button>
      <Button {...props} hexColor='#AA8866' variant={ButtonType.PRIMARY}>
        Hex Color
      </Button>
    </Flex>
  )
}

export const Sizes: Story = {
  render: (props) => (
    <Flex p='l' gap='l'>
      <Button {...props} size={ButtonSize.SMALL}>
        Small
      </Button>
      <Button {...props} size={ButtonSize.DEFAULT}>
        Default
      </Button>
      <Button {...props} size={ButtonSize.LARGE}>
        Large
      </Button>
    </Flex>
  )
}
