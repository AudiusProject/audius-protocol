import { Story } from '@storybook/react'

import { ModalHeader, ModalHeaderProps, ModalTitle } from '.'

export default {
  component: ModalHeader,
  title: 'Components/Modal/ModalHeader'
}

const Template: Story<ModalHeaderProps> = ({
  children = (
    <>
      This is a ModalHeader component. Use me inside a Modal (check the
      &quot;Composed&quot; Modal story for an example)!
    </>
  ),
  ...args
}) => {
  return <ModalHeader {...args}>{children}</ModalHeader>
}

export const Base = Template.bind({})

export const WithModalTitle = Template.bind({})

WithModalTitle.args = {
  children: <ModalTitle title='Title' subtitle='Subtitle' />
}

WithModalTitle.storyName = 'With ModalTitle'
