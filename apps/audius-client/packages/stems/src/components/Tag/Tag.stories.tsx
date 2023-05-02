import { Story } from '@storybook/react'

import { Tag, type TagProps } from './Tag'

export default {
  component: Tag,
  title: 'Components/Tag'
}

const Template: Story<TagProps<'span'>> = (args) => {
  return <Tag {...args} />
}

export const Base = Template.bind({})

Base.args = {
  tag: 'example tag'
}
