import {
  IconKebabHorizontal,
  IconButton,
  IconButtonButtonProps
} from '@audius/stems'
import cn from 'classnames'

import styles from './EditPlaylistNavItemButton.module.css'

type EditNavItemButtonProps = Omit<IconButtonButtonProps, 'icon'>

export const EditNavItemButton = (props: EditNavItemButtonProps) => {
  const { className, ...other } = props
  return (
    <IconButton
      {...other}
      className={cn(styles.root, className)}
      icon={<IconKebabHorizontal height={11} width={11} />}
    />
  )
}
