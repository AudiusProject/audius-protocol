import cn from 'classnames'

import { Button, Type as ButtonType } from 'components/Button'

import styles from './PillButton.module.css'
import { PillButtonProps, Variant as PillButtonVariant } from './types'

const VARIANT_STYLE_MAP = {
  [PillButtonVariant.PRIMARY]: styles.primary,
  [PillButtonVariant.SECONDARY]: styles.secondary
}
/**
 * @deprecated Used in feed-tip-tile
 */
export const PillButton = (props: PillButtonProps) => {
  const {
    text,
    onClick,
    variant = PillButtonVariant.PRIMARY,
    className,
    textClassName,
    ...other
  } = props
  return (
    <Button
      className={cn(styles.button, VARIANT_STYLE_MAP[variant], className)}
      textClassName={cn(styles.buttonText, textClassName)}
      type={ButtonType.COMMON}
      text={text}
      onClick={onClick}
      {...other}
    />
  )
}
