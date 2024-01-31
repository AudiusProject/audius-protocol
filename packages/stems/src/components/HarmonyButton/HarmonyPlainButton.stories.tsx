import { Story } from '@storybook/react'

import * as Icons from 'components/Icons'

import { HarmonyPlainButton } from './HarmonyPlainButton'
import {
  HarmonyPlainButtonProps,
  HarmonyPlainButtonSize,
  HarmonyPlainButtonType
} from './types'

export default {
  component: HarmonyPlainButton,
  title: 'Components/HarmonyPlainButton',
  argTypes: { onClick: { action: 'clicked' } }
}

const baseProps: HarmonyPlainButtonProps = {
  iconLeft: Icons.IconCampfire,
  iconRight: Icons.IconCampfire,
  text: 'Click Me'
}

type StoryArgs = {
  props: Partial<HarmonyPlainButtonProps>
  dark?: boolean
}

const Template: Story<StoryArgs> = ({ dark = false, props }) => (
  <div
    style={{
      background: dark ? '#878787' : undefined,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      padding: '16px',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}
  >
    <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
      <HarmonyPlainButton
        {...baseProps}
        size={HarmonyPlainButtonSize.DEFAULT}
        {...props}
      />
      <HarmonyPlainButton
        {...baseProps}
        size={HarmonyPlainButtonSize.LARGE}
        {...props}
      />
    </div>
    <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
      <HarmonyPlainButton
        {...baseProps}
        size={HarmonyPlainButtonSize.DEFAULT}
        {...props}
        disabled
      />
      <HarmonyPlainButton
        {...baseProps}
        size={HarmonyPlainButtonSize.LARGE}
        {...props}
        disabled
      />
    </div>
  </div>
)

// Default
export const Default: any = Template.bind({})

// Subdued
export const Subdued: any = Template.bind({})
Subdued.args = { props: { variant: HarmonyPlainButtonType.SUBDUED } }

// Inverted
export const Inverted: any = Template.bind({})
Inverted.args = {
  dark: true,
  props: { variant: HarmonyPlainButtonType.INVERTED }
}
