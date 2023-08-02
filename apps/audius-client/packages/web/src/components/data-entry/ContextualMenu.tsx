import { ReactNode, ReactElement, useCallback } from 'react'

import {
  Button,
  ButtonType,
  IconCaretRight,
  IconComponent,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import {
  Form,
  Formik,
  FormikConfig,
  FormikHelpers,
  FormikValues,
  useFormikContext
} from 'formik'
import { useToggle } from 'react-use'

import { Icon } from 'components/Icon'
import { HelperText } from 'components/data-entry/HelperText'
import { Tile } from 'components/tile'
import { Text } from 'components/typography'

import styles from './ContextualMenu.module.css'

const messages = {
  save: 'Save'
}

type MenuFormProps = {
  isOpen: boolean
  onClose: () => void
  label: string
  icon: ReactNode
  menuFields: ReactNode
}

const MenuForm = (props: MenuFormProps) => {
  const { isOpen, onClose, label, icon, menuFields } = props
  const { resetForm } = useFormikContext()

  const handleCancel = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  return (
    <Modal onClose={handleCancel} isOpen={isOpen} size='medium'>
      <ModalHeader>
        <ModalTitle title={label} icon={icon} />
      </ModalHeader>
      <Form>
        <ModalContent>{menuFields}</ModalContent>
        <ModalFooter>
          <Button
            type={ButtonType.PRIMARY}
            text={messages.save}
            buttonType='submit'
          />
        </ModalFooter>
      </Form>
    </Modal>
  )
}

type SelectedValueProps = {
  label?: string
  icon?: IconComponent
  children?: ReactNode
}

export const SelectedValue = (props: SelectedValueProps) => {
  const { label, icon, children } = props
  return (
    <span className={styles.selectedValue}>
      {icon ? <Icon icon={icon} size='small' /> : null}
      {label ? (
        <Text variant='body' strength='strong'>
          {label}
        </Text>
      ) : null}
      {children}
    </span>
  )
}

type ContextualMenuProps<Value, FormValues extends FormikValues> = {
  label: string
  description: string
  icon: ReactElement
  renderValue?: (value: Value) => JSX.Element | null
  menuFields: ReactNode
  value: Value
  error?: boolean
  errorMessage?: string
} & FormikConfig<FormValues>

export const ContextualMenu = <
  Value,
  FormValues extends FormikValues = FormikValues
>(
  props: ContextualMenuProps<Value, FormValues>
) => {
  const {
    label,
    description,
    icon,
    menuFields,
    renderValue: renderValueProp,
    onSubmit,
    value,
    error,
    errorMessage,
    ...formikProps
  } = props
  const [isMenuOpen, toggleMenu] = useToggle(false)

  const defaultRenderValue = useCallback((value: Value) => {
    const values =
      typeof value === 'string' && value
        ? [value]
        : Array.isArray(value) && value.length !== 0
        ? value
        : false

    if (!values) return null

    return (
      <div className={styles.value}>
        {values?.map((value) => (
          <SelectedValue key={value} label={value} />
        ))}
      </div>
    )
  }, [])

  const renderValue = renderValueProp ?? defaultRenderValue

  const preview = (
    <Tile onClick={toggleMenu} className={styles.root} elevation='flat'>
      <div className={styles.header}>
        <div className={styles.title}>
          <div>
            <Text className={styles.title} variant='title' size='large'>
              {label}
            </Text>
          </div>
          <div>
            <Icon icon={IconCaretRight} />
          </div>
        </div>
        <Text>{description}</Text>
      </div>
      {renderValue(value)}
      {error ? <HelperText error>{errorMessage}</HelperText> : null}
    </Tile>
  )

  const handleSubmit = useCallback(
    (values: FormValues, helpers: FormikHelpers<FormValues>) => {
      onSubmit(values, helpers)
      toggleMenu()
    },
    [onSubmit, toggleMenu]
  )

  return (
    <>
      {preview}
      <Formik {...formikProps} onSubmit={handleSubmit} enableReinitialize>
        <MenuForm
          label={label}
          icon={icon}
          isOpen={isMenuOpen}
          onClose={toggleMenu}
          menuFields={menuFields}
        />
      </Formik>
    </>
  )
}
