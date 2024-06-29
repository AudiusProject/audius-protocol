import { ChangeEvent, ComponentProps, PropsWithChildren } from 'react'

import { Switch, Text } from '@audius/harmony'
import { useField } from 'formik'

import styles from './SwitchRowField.module.css'
import { Tooltip } from 'components/tooltip'

type ToggleFieldProps = PropsWithChildren & {
  name: string
  header: string
  description?: string
  inverted?: boolean
  tooltipText?: string
} & Partial<ComponentProps<'input'>>

export const SwitchRowField = (props: ToggleFieldProps) => {
  const {
    name,
    header,
    description,
    inverted,
    tooltipText,
    children,
    ...inputOverrides
  } = props

  const [field] = useField({ name, type: 'checkbox' })

  const onChange = inverted
    ? (e: ChangeEvent<HTMLInputElement>) => {
        const modifiedEvent = { ...e }
        modifiedEvent.target.checked = !e.target.checked
        modifiedEvent.target.value =
          e.target.value === 'true' ? 'false' : 'true'
        field.onChange(modifiedEvent)
      }
    : field.onChange

  const inputId = `${name}-id`
  const descriptionId = `${name}-description`

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <Tooltip text={tooltipText} disabled={!tooltipText}>
          <Text tag='label' htmlFor={inputId} variant='title' size='l'>
            {header}
          </Text>
        </Tooltip>
        {description ? (
          <Text id={descriptionId} variant='body'>
            {description}
          </Text>
        ) : null}
        {(inverted ? !field.checked : field.checked) ? children : null}
      </div>
      <Switch
        {...field}
        id={inputId}
        aria-describedby={descriptionId}
        checked={inverted ? !field.checked : field.checked}
        onChange={onChange}
        {...inputOverrides}
      />
    </div>
  )
}
