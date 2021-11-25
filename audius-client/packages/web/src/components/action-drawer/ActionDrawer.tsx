import React from 'react'

import cn from 'classnames'

import Drawer from 'components/drawer/Drawer'
import { isDarkMode } from 'utils/theme/theme'

import styles from './ActionDrawer.module.css'

type Action = {
  text: string
  isDestructive?: boolean
}

type ActionSheetModalProps = {
  didSelectRow: (index: number) => void
  actions: Action[]
  isOpen: boolean
  onClose: () => void
  title?: string
  renderTitle?: () => React.ReactNode
}

// `ActionDrawer` is a drawer that presents a list of clickable rows with text
const ActionDrawer = ({
  didSelectRow,
  actions,
  isOpen,
  onClose,
  title,
  renderTitle
}: ActionSheetModalProps) => {
  const isDark = isDarkMode()

  return (
    <Drawer onClose={onClose} isOpen={isOpen} shouldClose={!isOpen}>
      <div className={styles.container}>
        <div className={styles.content}>
          {renderTitle
            ? renderTitle()
            : title && <div className={styles.title}>{title}</div>}
          {actions.map(({ text, isDestructive = false }, index) => (
            <div
              key={`${text}-${index}`}
              onClick={() => {
                didSelectRow(index)
              }}
              className={cn(
                styles.row,
                { [styles.darkAction]: isDark },
                { [styles.destructiveAction]: isDestructive }
              )}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  )
}

export default ActionDrawer
