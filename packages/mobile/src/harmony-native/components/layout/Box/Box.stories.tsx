import type { Meta, StoryObj } from '@storybook/react-native'

import { Text, Box } from '@audius/harmony-native'

import type { BoxProps } from './types'

const messages = {
  testText: 'My potions are too strong for you, traveler.'
}

const spacingArgs = {
  control: { type: 'select' },
  options: ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl']
}

const meta: Meta<BoxProps> = {
  title: 'Layout/Box',
  component: Box,
  parameters: {
    controls: { exclude: /^(theme|as)$/ }
  },
  argTypes: {
    h: {
      description: 'Height',
      control: {
        type: 'text'
      }
    },
    w: {
      description: 'Width',
      control: {
        type: 'text'
      }
    },
    p: { ...spacingArgs, description: 'Padding' },
    ph: { ...spacingArgs, description: 'Padding Horizontal' },
    pv: { ...spacingArgs, description: 'Padding Vertical' },
    pt: { ...spacingArgs, description: 'Padding Top' },
    pl: { ...spacingArgs, description: 'Padding Left' },
    pr: { ...spacingArgs, description: 'Padding Right' },
    pb: { ...spacingArgs, description: 'Padding Bottom' },
    m: { ...spacingArgs, description: 'Margin' },
    mh: { ...spacingArgs, description: 'Margin Horizontal' },
    mv: { ...spacingArgs, description: 'Margin Vertical' },
    mt: { ...spacingArgs, description: 'Margin Top' },
    ml: { ...spacingArgs, description: 'Margin Left' },
    mr: { ...spacingArgs, description: 'Margin Right' },
    mb: { ...spacingArgs, description: 'Margin Bottom' },
    border: {
      description: 'Border',
      control: { type: 'radio' },
      options: ['default', 'strong']
    },
    borderRadius: {
      description: 'Border Radius',
      control: { type: 'select' },
      options: ['xs', 's', 'm', 'l', 'xl', '2xl']
    },
    shadow: {
      description: 'Elevation Shadow',
      control: { type: 'radio' },
      options: ['near', 'mid', 'far', 'emphasis']
    }
  },
  render: (props) => {
    return (
      <Box {...props}>
        <Text>{messages.testText}</Text>
      </Box>
    )
  }
}

export default meta

type Story = StoryObj<BoxProps>

export const Default: Story = {}

export const BoxWithBorder: Story = {
  args: {
    p: 'm',
    ph: 'l',
    shadow: 'near',
    border: 'strong',
    borderRadius: 's',
    m: 'xl'
  }
}
