import { Text } from '@audius/harmony'

import { TextLink } from 'components/link'

export const ContentLink = (props: {
  link: string
  title: string
  onClick: () => void
}) => {
  const { link, title, ...other } = props
  return (
    <TextLink to={link} size='l' {...other}>
      <Text ellipses>{title}</Text>
    </TextLink>
  )
}
