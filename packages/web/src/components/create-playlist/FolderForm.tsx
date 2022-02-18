import React, { FormEvent, useState } from 'react'

import { Button, ButtonType, IconCheck } from '@audius/stems'
import { isEmpty } from 'lodash'

import Input from 'components/data-entry/Input'

import styles from './FolderForm.module.css'

const messages = {
  createFolderButtonText: 'Create Folder'
}

type FolderFormProps = {
  onSubmit: (folderName: string) => void
  initialFolderName?: string
}

const FolderForm = ({ onSubmit, initialFolderName = '' }: FolderFormProps) => {
  const [folderName, setFolderName] = useState(initialFolderName)
  const [inputHasError, setInputHasError] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const onChangeFolderName = (newName: string) => {
    setFolderName(newName)
  }

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isEmpty(folderName)) {
      setInputHasError(true)
    } else {
      setInputHasError(false)
      setHasSubmitted(true)
      onSubmit(folderName)
    }
  }

  return (
    <div className={styles.folderForm}>
      <form onSubmit={onFormSubmit}>
        <Input
          variant='elevatedPlaceholder'
          placeholder='Folder Name'
          defaultValue={folderName}
          error={inputHasError}
          onChange={onChangeFolderName}
          characterLimit={64}
        />
        <div className={styles.folderFormButtonContainer}>
          <Button
            buttonType='submit'
            type={hasSubmitted ? ButtonType.DISABLED : ButtonType.PRIMARY}
            disabled={hasSubmitted}
            text={messages.createFolderButtonText}
            name='continue'
            rightIcon={<IconCheck />}
          />
        </div>
      </form>
    </div>
  )
}

export default FolderForm
