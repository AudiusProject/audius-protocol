import { Story } from '@storybook/react'

import { IconPlaylists } from 'components/Icons'

import { IconButton, IconButtonProps } from './'

export default {
  component: IconButton,
  title: 'Components/IconButton'
}

const Template: Story<IconButtonProps> = (args: any) => {
  return <IconButton {...args} />
}

export const Base: any = Template.bind({})
const baseProps: IconButtonProps = {
  icon: <IconPlaylists />,
  'aria-label': 'Add playlist'
}

Base.args = baseProps
