import type { Meta, StoryObj } from '@storybook/react-native'

import type { PillProps } from './Pill'
import { Pill } from './Pill'

const meta: Meta<PillProps> = {
  title: 'Components/Button/Button',
  component: Pill,
  render: (props) => <Pill {...props} />
}

export default meta

type Story = StoryObj<PillProps>

export const Default: Story = {}
