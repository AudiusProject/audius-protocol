import { Story } from '@storybook/react'

import * as Icons from 'components/Icons'

import { Button } from './Button'
import { ButtonProps, Type } from './types'

import { Size } from './index'

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
export const Primary: any = Template.bind({})

// Disabled
export const Disabled: any = Template.bind({})
Disabled.args = { disabled: true }

// Primary Alt
export const PrimaryAlt: any = Template.bind({})
PrimaryAlt.args = { type: Type.PRIMARY_ALT }

// Primary w/ color
export const PrimaryWithColor: any = Template.bind({})
PrimaryWithColor.args = { color: 'accentBlue' }

// Secondary
export const Secondary: any = Template.bind({})
Secondary.args = { type: Type.SECONDARY }

// Common
export const Common: any = Template.bind({})
Common.args = { type: Type.COMMON }

// Common Alt
export const CommonAlt: any = Template.bind({})
CommonAlt.args = { type: Type.COMMON_ALT }

// Glass
export const Glass: any = BackgroundTemplate.bind({})
Glass.args = { type: Type.GLASS }

// White
export const White: any = Template.bind({})
White.args = { type: Type.WHITE }

// Text
export const Text: any = Template.bind({})
Text.args = { type: Type.TEXT }

// Destructive
export const Destructive: any = Template.bind({})
Destructive.args = { type: Type.DESTRUCTIVE }
