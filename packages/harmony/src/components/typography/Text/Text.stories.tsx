import React from 'react'

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
      options: ['xl', 'l', 'm', 's', 'xs']
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

export const Disabled: Story = {
  args: {
    variant: 'body',
    color: 'disabled'
  }
}

export const StrongDisplay: Story = {
  args: {
    variant: 'display',
    color: 'heading',
    strength: 'strong',
    size: 's'
  }
}

export const LargeTitle: Story = {
  args: {
    variant: 'title',
    size: 'l'
  }
}

export const SubduedLabel: Story = {
  args: {
    variant: 'label',
    color: 'subdued'
  }
}
