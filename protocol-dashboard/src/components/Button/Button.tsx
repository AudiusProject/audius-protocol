import React from 'react'

import {
  Button as StemButton,
  ButtonSize as StemButtonSize,
  ButtonProps as StemsButtonProps,
  ButtonType as StemsButtonType
} from '@audius/stems'
import clsx from 'clsx'

import styles from './Button.module.css'

export enum CustomButtonType {
  RED = 'RED',
  GREEN = 'GREEN'
}

export const ButtonSize = StemButtonSize
export const ButtonType = {
  ...StemsButtonType,
  ...CustomButtonType
}

type ButtonProps = Omit<StemsButtonProps, 'type'> & {
  type?: CustomButtonType | StemsButtonType
  isDepressed?: boolean
}

const Button = (props: ButtonProps) => {
  const { type, ...restProps } = props
  const validStemsBtnType = Object.values(StemsButtonType).includes(type as any)
  return (
    <span className={styles.btnContainer}>
      <StemButton
        {...restProps}
        includeHoverAnimations={props.type !== StemsButtonType.PRIMARY}
        type={
          (validStemsBtnType ? type : undefined) as StemsButtonType | undefined
        }
        className={clsx({
          [props.className!]: !!props.className,
          [styles.primary]: props.type === StemsButtonType.PRIMARY,
          [styles.primaryAlt]: props.type === StemsButtonType.PRIMARY_ALT,
          [styles.red]: props.type === ButtonType.RED,
          [styles.green]: props.type === ButtonType.GREEN,
          [styles.isDepressed]: props.isDepressed,
          [styles.isDisabled]: props.isDisabled
        })}
        textClassName={clsx({
          [props.textClassName!]: !!props.textClassName,
          [styles.primaryText]: props.type === StemsButtonType.PRIMARY,
          [styles.primaryAltText]: props.type === StemsButtonType.PRIMARY_ALT,
          [styles.redText]: props.type === ButtonType.RED,
          [styles.greenText]: props.type === ButtonType.GREEN,
          [styles.isDepressed]: props.isDepressed,
          [styles.isTextDisabled]: props.isDisabled
        })}
      />
    </span>
  )
}

export default Button
