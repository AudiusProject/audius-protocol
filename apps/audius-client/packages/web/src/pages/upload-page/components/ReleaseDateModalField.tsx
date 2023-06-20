import { useState } from 'react'

import {
  Button,
  ButtonType,
  IconCalendar,
  IconCaretRight,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import cn from 'classnames'
import { useField } from 'formik'

import { DatePickerField } from '../fields/DatePickerField'

import styles from './ReleaseDateModalField.module.css'

const messages = {
  title: 'Release Date',
  description:
    'Specify a release date (in the past) for your music. Release date will affect the order of content on your profile and is visible to users.',
  done: 'Done'
}

const FIELD_NAME = 'releaseDate'

export const ReleaseDateModalField = () => {
  const [{ value }] = useField<moment.Moment>(FIELD_NAME)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const open = () => setIsModalOpen(true)
  const close = () => setIsModalOpen(false)

  const modal = (
    <div className={styles.modal}>
      <Modal onClose={close} isOpen={isModalOpen}>
        <ModalHeader>
          <div className={styles.modalHeader}>
            <ModalTitle
              className={styles.modalTitle}
              title={messages.title}
              icon={<IconCalendar className={styles.titleIcon} />}
            />
          </div>
        </ModalHeader>
        <ModalContent>
          <h3 className={cn(styles.title, styles.modalHeading)}>
            {messages.title}
          </h3>
          <p className={styles.description}>{messages.description}</p>
          <div className={styles.datePicker}>
            <DatePickerField name={FIELD_NAME} label={'Release Date'} />
          </div>
        </ModalContent>
        <ModalFooter>
          <Button
            type={ButtonType.PRIMARY}
            text={messages.done}
            onClick={close}
          />
        </ModalFooter>
      </Modal>
    </div>
  )

  return (
    <>
      <div className={styles.displayTile} onClick={open}>
        <div className={styles.header}>
          <div className={styles.title}>{messages.title}</div>
          <IconCaretRight className={styles.caret} />
        </div>
        <div className={styles.description}>{messages.description}</div>
        <div className={styles.valueDisplay}>
          <IconCalendar className={styles.calendarIcon} />
          {value.calendar().split(' at')[0]}
        </div>
      </div>
      {modal}
    </>
  )
}
