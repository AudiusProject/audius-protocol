import { Text } from '@audius/harmony'

import { TextLink, type TextLinkProps } from 'components/link'

export const ContentLink = (
  props: {
    link: string
    title: string
  } & Omit<TextLinkProps, 'to' | 'size'>
) => {
  const { link, title, ...other } = props
  return (
    <TextLink to={link} size='l' {...other}>
      <Text ellipses>{title}</Text>
    </TextLink>
  )
}
