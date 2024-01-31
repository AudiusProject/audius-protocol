import { Story } from '@storybook/react'

import { MarkdownViewer, MarkdownViewerProps } from '.'

export default {
  component: MarkdownViewer,
  title: 'Components/MarkdownViewer'
}

const defaultProps: MarkdownViewerProps = {
  markdown: `
# Hello
Good morning

## Section 1

1. This
2. Is
3. An ordered list
    1. And
    2. A
    3. Sublist

You can also **bold** and _italicize_ things.
And make

* Bullet1
* Bullet2
* Bullet3

## Appendix

Read more here: [link](https://example.com)
  `
}

const Template: Story<MarkdownViewerProps> = (args) => {
  return <MarkdownViewer {...defaultProps} {...args} />
}

// Default
export const Default: any = Template.bind({})
