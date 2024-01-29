import { ReactNode, ReactElement, useCallback, useMemo } from 'react'

import { Nullable } from '@audius/common'
import { Box, Text as HarmonyText } from '@audius/harmony'
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
  FormikErrors,
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
  displayMenuErrorMessage?: (errors: FormikErrors<any>) => Nullable<string>
}

const MenuForm = (props: MenuFormProps) => {
  const { isOpen, onClose, label, icon, menuFields, displayMenuErrorMessage } =
    props
  const { resetForm, errors } = useFormikContext()

  const handleCancel = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const errorMessage = useMemo(() => {
    if (errors && displayMenuErrorMessage) {
      return displayMenuErrorMessage(errors)
    }
  }, [displayMenuErrorMessage, errors])

  return (
    <Modal onClose={handleCancel} isOpen={isOpen} size='medium'>
      <ModalHeader>
        <ModalTitle title={label} icon={icon} />
      </ModalHeader>
      <ModalContent>
        <Form id={label}>{menuFields}</Form>
      </ModalContent>
      <ModalFooter className={styles.footer}>
        {errorMessage ? (
          <Box pb='l' ph='xl'>
            <HarmonyText variant='body' color='danger' size='s'>
              {errorMessage}
            </HarmonyText>
          </Box>
        ) : null}
        <Button
          form={label}
          type={ButtonType.PRIMARY}
          text={messages.save}
          buttonType='submit'
        />
      </ModalFooter>
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
      {label ? <Text strength='strong'>{label}</Text> : null}
      {children}
    </span>
  )
}

type SelectedValuesProps = {
  children: ReactNode
}

export const SelectedValues = (props: SelectedValuesProps) => {
  const { children } = props
  return <span className={styles.value}>{children}</span>
}

type ContextualMenuProps<FormValues extends FormikValues> = {
  label: string
  description: string
  icon: ReactElement
  renderValue: () => JSX.Element | null
  menuFields: ReactNode
  error?: boolean
  errorMessage?: string
  displayMenuErrorMessage?: (
    errors: FormikErrors<FormValues>
  ) => Nullable<string>
  previewOverride?: (toggleMenu: () => void) => ReactNode
} & FormikConfig<FormValues>

export const ContextualMenu = <FormValues extends FormikValues = FormikValues>(
  props: ContextualMenuProps<FormValues>
) => {
  const {
    label,
    description,
    icon,
    menuFields,
    renderValue,
    onSubmit,
    error,
    errorMessage,
    displayMenuErrorMessage,
    previewOverride,
    ...formikProps
  } = props
  const [isMenuOpen, toggleMenu] = useToggle(false)

  const preview = previewOverride ? (
    previewOverride(toggleMenu)
  ) : (
    <Tile onClick={toggleMenu} className={styles.root} elevation='flat'>
      <div className={styles.header}>
        <div className={styles.title}>
          <Text className={styles.title} variant='title' size='large'>
            {label}
          </Text>
          <Icon icon={IconCaretRight} color='neutralLight4' />
        </div>
        <Text className={styles.description}>{description}</Text>
      </div>
      {renderValue()}
      {error ? <HelperText error>{errorMessage}</HelperText> : null}
    </Tile>
  )

  const handleSubmit = useCallback(
    (values: FormValues, helpers: FormikHelpers<FormValues>) => {
      onSubmit(values, helpers)
      if (!error) toggleMenu()
    },
    [error, onSubmit, toggleMenu]
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
          displayMenuErrorMessage={displayMenuErrorMessage}
        />
      </Formik>
    </>
  )
}
