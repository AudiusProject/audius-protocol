import cn from 'classnames'
import { Link as LinkBase, LinkProps as LinkBaseProps } from 'react-router-dom'

import { Text } from 'components/typography'
import { TextProps } from 'components/typography/Text'

import styles from './Link.module.css'

type LinkProps = LinkBaseProps<'a'> & TextProps<'a'>

export const Link = (props: LinkProps) => {
  const { className, ...other } = props
  return (
    <Text as={LinkBase} className={cn(styles.root, className)} {...other} />
  )
}
