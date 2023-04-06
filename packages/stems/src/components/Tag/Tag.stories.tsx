import { DecoratorFn, Story } from '@storybook/react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'

import { Tag, type TagProps } from './Tag'

const reactRouterDecorator: DecoratorFn = (Story) => {
  return (
    <MemoryRouter>
      <Switch>
        <Route path='/*' element={<Story />} />
      </Switch>
    </MemoryRouter>
  )
}

export default {
  component: Tag,
  title: 'Components/Tag',
  decorators: [reactRouterDecorator]
}

const Template: Story<TagProps> = (args) => {
  return <Tag {...args} />
}

export const Base = Template.bind({})

Base.args = {
  tag: 'example tag'
}
