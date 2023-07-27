import { ChangeEvent, ComponentProps, PropsWithChildren } from 'react'

import { Switch } from '@audius/stems'
import { useField } from 'formik'

import { Text } from 'components/typography'

import styles from './SwitchRowField.module.css'

type ToggleFieldProps = PropsWithChildren & {
  name: string
  header: string
  description: string
  inverted?: boolean
} & Partial<ComponentProps<'input'>>

export const SwitchRowField = (props: ToggleFieldProps) => {
  const { name, header, description, inverted, children, ...inputOverrides } =
    props
  const [field] = useField({
    name,
    type: 'checkbox'
  })

  const onChange = inverted
    ? (e: ChangeEvent<HTMLInputElement>) => {
        const modifiedEvent = { ...e }
        modifiedEvent.target.checked = !e.target.checked
        modifiedEvent.target.value =
          e.target.value === 'true' ? 'false' : 'true'
        field.onChange(modifiedEvent)
      }
    : field.onChange

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <Text className={styles.title} variant='title' size='large'>
          {header}
        </Text>
        <Text>{description}</Text>
        {(inverted ? !field.checked : field.checked) ? children : null}
      </div>
      <Switch
        {...field}
        checked={inverted ? !field.checked : field.checked}
        onChange={onChange}
        {...inputOverrides}
      />
    </div>
  )
}
