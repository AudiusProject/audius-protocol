import { ComponentProps, PropsWithChildren } from 'react'

import { Switch } from '@audius/stems'
import cn from 'classnames'
import { useField } from 'formik'

import styles from './ToggleRowField.module.css'

type ToggleFieldProps = PropsWithChildren & {
  name: string
  header: string
  description: string
} & Partial<ComponentProps<'input'>>

export const ToggleRowField = (props: ToggleFieldProps) => {
  const { name, header, description, children, ...inputOverrides } = props
  const [field] = useField({
    name,
    type: 'checkbox'
  })

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <h3 className={cn(styles.title, styles.modalHeading)}>{header}</h3>
        <p className={styles.description}>{description}</p>
        {field.checked ? children : null}
      </div>
      <Switch {...field} {...inputOverrides} />
    </div>
  )
}
