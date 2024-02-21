import { Story } from '@storybook/react'

import { Button } from './Button'
import { ButtonProps, Type } from './types'

import { Size } from './index'

export default {
  component: Button,
  title: 'Components/Button',
  argTypes: { onClick: { action: 'clicked' } }
}

const baseProps: ButtonProps = {
  text: 'Click Me'
}

const Template: Story<ButtonProps> = (args) => (
  <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
    <Button {...baseProps} size={Size.TINY} {...args} />
    <Button {...baseProps} size={Size.SMALL} {...args} />
    <Button {...baseProps} size={Size.MEDIUM} {...args} />
    <Button {...baseProps} size={Size.LARGE} {...args} />
  </div>
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

// Primary w/ color
export const PrimaryWithColor = Template.bind({})
PrimaryWithColor.args = { color: 'accentBlue' }

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

// Text
export const Text = Template.bind({})
Text.args = { type: Type.TEXT }

// Destructive
export const Destructive = Template.bind({})
Destructive.args = { type: Type.DESTRUCTIVE }
