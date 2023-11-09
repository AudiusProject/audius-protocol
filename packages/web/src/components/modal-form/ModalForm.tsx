import cn from 'classnames'
import { Form, FormikFormProps } from 'formik'

import styles from './ModalForm.module.css'

/**
 * Styles a Formik Form properly to allow it to parent the contents of a modal
 * while maintaining the normal behaviors of ModalHeader, ModalFooter, and ModalContent.
 * Can't be moved to Stems or else Formik contexts are mismatched between versions if used in Web.
 * Must be used inside the <Formik> context.
 */
export const ModalForm = ({
  className,
  children,
  ...formProps
}: FormikFormProps) => {
  return (
    <Form {...formProps} className={cn(styles.root, className)}>
      {children}
    </Form>
  )
}
