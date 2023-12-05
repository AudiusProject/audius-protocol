import type { Meta, StoryObj } from '@storybook/react-native'

import { Text, Paper } from '@audius/harmony-native'

import type { NativePaperProps } from './types'

const meta: Meta<NativePaperProps> = {
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

type Story = StoryObj<NativePaperProps>

export const Default: Story = {
  args: {
    w: 248,
    h: 84,
    m: 'xl',
    justifyContent: 'center',
    alignItems: 'center'
  }
}
