import type { Meta, StoryObj } from '@storybook/react-native'

import { Text, Paper } from '@audius/harmony-native'

import type { PaperProps } from './types'

const meta: Meta<PaperProps> = {
  title: 'Layout/Paper',
  component: Paper,
  parameters: {
    controls: {
      include: ['w', 'h', 'backgroundColor', 'border', 'borderRadius', 'shadow']
    }
  },
  render: (props) => (
    <Paper {...props}>
      <Text>Paper</Text>
    </Paper>
  )
}

export default meta

type Story = StoryObj<PaperProps>

export const Default: Story = {
  args: {
    w: 248,
    h: 84,
    m: 'xl',
    justifyContent: 'center',
    alignItems: 'center'
  }
}
