import { expect } from '@storybook/jest'
import type { Meta, StoryObj } from '@storybook/react'
import { within } from '@storybook/testing-library'

import { Text } from './Text'

const messages = {
  slogan:
    'Audius, freedom to share and listen. Giving everyone the freedom to distribute, monetize, and stream unstoppable audio.'
}

const meta: Meta<typeof Text> = {
  title: 'Text/Text',
  component: Text,
  argTypes: {
    variant: {
      description: 'Text Variant',
      control: { type: 'select' },
      options: ['display', 'heading', 'title', 'label', 'body']
    },
    strength: {
      description: 'Font Strength/Weight',
      control: { type: 'radio' },
      options: ['strong', 'default', 'weak']
    },
    size: {
      description: 'Font Size',
      control: { type: 'select' },
      options: ['xl', 'l', 'm', 's', 'xs']
    },
    color: {
      description: 'Text Color',
      control: { type: 'select' },
      options: ['heading', 'default', 'subdued', 'disabled', 'accent']
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
  },

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('heading', { level: 1 })).toBeInTheDocument()
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
