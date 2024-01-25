import { ComponentProps, forwardRef } from 'react'

import cn from 'classnames'

import { useIsMobile } from 'hooks/useIsMobile'

import styles from './UpdateDot.module.css'

type UpdateDotProps = ComponentProps<'span'>

const UpdateDot = forwardRef<HTMLSpanElement, UpdateDotProps>((props, ref) => {
  const { className, ...other } = props
  const isMobile = useIsMobile()

  return isMobile ? (
    <span
      {...other}
      ref={ref}
      className={cn(styles.mobileUpdateDot, className)}
    />
  ) : (
    <span {...other} ref={ref} className={cn(styles.updateDot, className)} />
  )
})

export default UpdateDot
