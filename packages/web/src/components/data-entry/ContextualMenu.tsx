import {
  ReactNode,
  ReactElement,
  useCallback,
  useMemo,
  useEffect,
  HTMLAttributes
} from 'react'

import { Nullable } from '@audius/common/utils'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Box,
  Text,
  IconCaretRight,
  IconComponent,
  Button,
  Flex,
  Paper
} from '@audius/harmony'
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

import { HelperText } from 'components/data-entry/HelperText'

const messages = {
  save: 'Save'
}

export enum MenuFormCallbackStatus {
  OPEN_ACCESS_AND_SALE = 'OPEN_ACCESS_AND_SALE'
}

type MenuFormProps = {
  isOpen: boolean
  onClose: () => void
  label: string
  icon: ReactNode
  menuFields: ReactNode
  closeMenuCallback?: (data?: any) => void
  displayMenuErrorMessage?: (errors: FormikErrors<any>) => Nullable<string>
}

const MenuForm = (props: MenuFormProps) => {
  const {
    isOpen,
    onClose,
    label,
    icon,
    menuFields,
    closeMenuCallback,
    displayMenuErrorMessage
  } = props
  const { resetForm, errors, initialStatus, status, setStatus } =
    useFormikContext()

  const handleCancel = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const errorMessage = useMemo(() => {
    if (errors && displayMenuErrorMessage) {
      return displayMenuErrorMessage(errors)
    }
  }, [displayMenuErrorMessage, errors])

  useEffect(() => {
    // If the menu is closed, trigger callback if exists and reset the status
    if (!isOpen) {
      closeMenuCallback?.(status)
      setStatus(initialStatus)
    }
  }, [isOpen, closeMenuCallback, status, setStatus, initialStatus])

  return (
    <Modal onClose={handleCancel} isOpen={isOpen} size='medium'>
      <ModalHeader>
        <ModalTitle title={label} icon={icon} />
      </ModalHeader>
      <ModalContent>
        <Form id={label}>{menuFields}</Form>
      </ModalContent>
      <Flex as={ModalFooter} direction='column' alignItems='center'>
        {errorMessage ? (
          <Box pb='l' ph='xl'>
            <Text variant='body' color='danger' size='s'>
              {errorMessage}
            </Text>
          </Box>
        ) : null}
        <Button variant='primary' form={label} type='submit'>
          {messages.save}
        </Button>
      </Flex>
    </Modal>
  )
}

export type SelectedValueProps = {
  label?: string
  icon?: IconComponent
  children?: ReactNode
  'data-testid'?: string
} & HTMLAttributes<HTMLSpanElement>

export const SelectedValue = (props: SelectedValueProps) => {
  const { label, icon: Icon, children, ...rest } = props
  return (
    <Flex
      inline
      pv='xs'
      ph='s'
      gap='xs'
      alignItems='center'
      border='strong'
      backgroundColor='surface2'
      css={{ borderRadius: '2px' }}
      {...rest}
    >
      {Icon ? <Icon size='s' color='default' /> : null}
      {label ? (
        <Text variant='body' size='s' strength='default'>
          {label}
        </Text>
      ) : null}
      {children}
    </Flex>
  )
}

type SelectedValuesProps = {
  children: ReactNode
}

export const SelectedValues = (props: SelectedValuesProps) => {
  const { children } = props
  return (
    <Flex inline gap='s' wrap='wrap' css={{ flexShrink: 1 }}>
      {children}
    </Flex>
  )
}

type ContextualMenuProps<FormValues extends FormikValues> = {
  label: string
  description: string
  icon: ReactElement
  renderValue: () => JSX.Element | null
  menuFields: ReactNode
  closeMenuCallback?: (data?: any) => void
  forceOpen?: boolean
  setForceOpen?: (value: boolean) => void
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
    forceOpen,
    setForceOpen,
    closeMenuCallback,
    error,
    errorMessage,
    displayMenuErrorMessage,
    previewOverride,
    ...formikProps
  } = props
  const [isMenuOpen, toggleMenu] = useToggle(false)

  useEffect(() => {
    // If forceOpen is true, open the menu and reset the forceOpen flag
    if (forceOpen && setForceOpen) {
      setForceOpen(false)
      toggleMenu()
    }
  }, [forceOpen, setForceOpen, toggleMenu])

  const preview = previewOverride ? (
    previewOverride(toggleMenu)
  ) : (
    <Paper
      onClick={toggleMenu}
      shadow='flat'
      w='100%'
      gap='m'
      ph='xl'
      pv='l'
      direction='column'
      border='default'
      css={{ cursor: 'pointer' }}
    >
      <Flex direction='column' w='100%' gap='s'>
        <Flex
          direction='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Text variant='title' size='l'>
            {label}
          </Text>
          <IconCaretRight color='subdued' size='s' />
        </Flex>
        <Text variant='body' textAlign='left'>
          {description}
        </Text>
      </Flex>
      <Box flex={1}>{renderValue()}</Box>
      {error ? <HelperText error>{errorMessage}</HelperText> : null}
    </Paper>
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
          closeMenuCallback={closeMenuCallback}
          displayMenuErrorMessage={displayMenuErrorMessage}
        />
      </Formik>
    </>
  )
}
