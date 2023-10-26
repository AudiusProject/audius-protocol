import type { Meta } from '@storybook/react'

import { Flex } from 'components/layout'

import { SocialButton } from './SocialButton'

const meta: Meta<typeof SocialButton> = {
  title: 'Components/Buttons/SocialButton',
  component: SocialButton
}

export default meta

export const SocialButtons = () => (
  <Flex gap='m'>
    <SocialButton socialType='tiktok' aria-label='TikTok button' />
    <SocialButton socialType='instagram' aria-label='Instagram button' />
    <SocialButton socialType='twitter' aria-label='Twitter button' />
  </Flex>
)
