import cn from 'classnames'

import styles from './TextElement.module.css'

export enum Type {
  PRIMARY = 'primary',
  SECONDARY = 'secondary'
}

type TextElementProps = {
  text: string
  onClick: () => void
  isEnabled?: boolean
  type?: Type
}

const TextElement = ({
  text,
  onClick,
  isEnabled = true,
  type = Type.SECONDARY
}: TextElementProps) => {
  return (
    <div
      className={cn(styles.textElement, {
        [styles.primary]: type === Type.PRIMARY,
        [styles.secondary]: type === Type.SECONDARY,
        [styles.isEnabled]: isEnabled
      })}
      onClick={isEnabled ? onClick : () => {}}
    >
      {text}
    </div>
  )
}

export default TextElement
