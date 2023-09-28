import type { Meta, StoryObj } from '@storybook/react'

import { Text } from './Text'

const messages = {
  slogan:
    'Audius, freedom to share and listen. Giving everyone the freedom to distribute, monetize, and stream unstoppable audio.'
}

const meta: Meta<typeof Text> = {
  title: 'Components/Text',
  component: Text,
  argTypes: {
    variant: {
      control: { type: 'radio' },
      options: ['display', 'heading', 'title', 'label', 'body']
    },
    strength: {
      control: { type: 'radio' },
      options: ['strong', 'default', 'weak']
    },
    size: {
      control: { type: 'radio' },
      options: ['xLarge', 'large', 'medium', 'small', 'xSmall']
    },
    color: {
      control: { type: 'radio' },
      options: ['heading', 'default', 'subdued', 'disabled']
    }
  },
  render: (props) => <Text {...props}>{messages.slogan}</Text>
}

export default meta

type Story = StoryObj<typeof Text>

export const Default: Story = {}

export const Body: Story = {
  args: {
    variant: 'body'
  }
}

export const Heading: Story = {
  args: {
    variant: 'heading'
  }
}
