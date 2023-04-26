import {
  IconKebabHorizontal,
  IconButton,
  IconButtonButtonProps
} from '@audius/stems'

import styles from './EditPlaylistNavItemButton.module.css'

type EditNavItemButtonProps = Omit<IconButtonButtonProps, 'icon'>

export const EditNavItemButton = (props: EditNavItemButtonProps) => {
  return (
    <IconButton
      {...props}
      className={styles.root}
      icon={<IconKebabHorizontal height={11} width={11} />}
    />
  )
}
