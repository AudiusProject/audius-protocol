import { Story } from '@storybook/react'

import * as Icons from 'components/Icons'

import { Button } from './Button'
import { ButtonProps, Type } from './types'

export default {
  component: Button,
  title: 'Components/Button',
  argTypes: { onClick: { action: 'clicked' } }
}

const baseProps: ButtonProps = {
  leftIcon: <Icons.IconPlay />,
  text: 'Click Me'
}

const Template: Story<ButtonProps> = (args) => (
  <Button {...baseProps} {...args} />
)

const BackgroundTemplate: Story<ButtonProps> = (args) => (
  <div style={{ backgroundColor: '#555', padding: '16px' }}>
    <Button {...baseProps} {...args} />
  </div>
)

// Primary
export const Primary = Template.bind({})

// Disabled
export const Disabled = Template.bind({})
Disabled.args = { disabled: true }

// Primary Alt
export const PrimaryAlt = Template.bind({})
PrimaryAlt.args = { type: Type.PRIMARY_ALT }

// Secondary
export const Secondary = Template.bind({})
Secondary.args = { type: Type.SECONDARY }

// Common
export const Common = Template.bind({})
Common.args = { type: Type.COMMON }

// Common Alt
export const CommonAlt = Template.bind({})
CommonAlt.args = { type: Type.COMMON_ALT }

// Glass
export const Glass = BackgroundTemplate.bind({})
Glass.args = { type: Type.GLASS }

// White
export const White = Template.bind({})
White.args = { type: Type.WHITE }
