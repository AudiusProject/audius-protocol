import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { mapValues } from 'lodash'
import { Button, ButtonSize, ButtonType } from '@audius/stems'

import * as schemas from 'schemas'

import Modal from 'components/general/Modal'
import FormTile from 'components/data-entry/FormTile'

import styles from './EditTrackModal.module.css'
import { useTrackCoverArt } from 'hooks/useImageSize'
import { SquareSizes } from 'models/common/ImageSizes'

const EditTrackModal = props => {
  const {
    visible,
    title,
    onCancel,
    onSave,
    metadata,
    showUnlistedToggle,
    stems,
    onAddStems,
    onSelectStemCategory,
    onDeleteStem
  } = props
  const initialForm = schemas.newTrackMetadata(metadata)
  const [formFields, setFormFields] = useState(initialForm)
  const [invalidFields, setInvalidFields] = useState(
    mapValues(formFields, v => false)
  )
  const requiredFields = mapValues(formFields, v => false)
  requiredFields.genre = true
  requiredFields.title = true

  const coverArt = useTrackCoverArt(
    metadata ? metadata.track_id : null,
    metadata ? metadata._cover_art_sizes : null,
    SquareSizes.SIZE_1000_BY_1000
  )

  useEffect(() => {
    // If we're visible, the local form state
    // should be considered the source of truth
    if (visible) return
    setFormFields({ ...metadata })
  }, [visible, metadata])

  const onClickSave = () => {
    if (validateFormFields(formFields)) {
      onSave(formFields)
    }
  }

  const onClose = () => {
    setFormFields(initialForm)
    onCancel()
  }

  const updateTrack = (field, value, invalid) => {
    if (invalid) {
      setInvalidFields(oldInvalidFields => ({
        ...oldInvalidFields,
        [field]: true
      }))
    } else {
      setInvalidFields(oldInvalidFields => ({
        ...oldInvalidFields,
        [field]: false
      }))
      setFormFields(oldFields => ({ ...oldFields, [field]: value }))
    }
  }

  const validateFormFields = formFields => {
    const newInvalidFields = {
      ...invalidFields,
      genre: !formFields.genre,
      title: !formFields.title
    }
    setInvalidFields(newInvalidFields)
    return Object.values(newInvalidFields).every(f => !f)
  }

  return (
    <Modal
      title={title}
      width={1080}
      visible={visible}
      onClose={onClose}
      // Antd modal default value, behind DropdownInput
      zIndex={1000}
    >
      <div className={styles.editTrack}>
        <FormTile
          // Key the form tile by id so each id gets a different instance
          // of input fields to preserve correct default values
          key={formFields.track_id}
          showPreview={false}
          defaultFields={formFields}
          coverArt={coverArt}
          invalidFields={invalidFields}
          requiredFields={requiredFields}
          onChangeField={(field, value, invalid) =>
            updateTrack(field, value, invalid)
          }
          stems={stems}
          onDeleteStem={onDeleteStem}
          onAddStems={onAddStems}
          onSelectStemCategory={onSelectStemCategory}
          showUnlistedToggle={showUnlistedToggle}
          showHideTrackSectionInModal={false}
        />
        <div className={styles.buttons}>
          <div className={styles.buttonsLeft}>
            {props.onDelete ? (
              <Button
                text='DELETE TRACK'
                size={ButtonSize.TINY}
                type={ButtonType.SECONDARY}
                onClick={props.onDelete}
                textClassName={styles.deleteButtonText}
                className={styles.deleteButton}
              />
            ) : null}
          </div>
          <div className={styles.buttonsLeft}>
            <Button
              text='CANCEL'
              size={ButtonSize.TINY}
              type={ButtonType.COMMON}
              onClick={onCancel}
            />
            <Button
              className={styles.saveChangesButton}
              text='SAVE CHANGES'
              size={ButtonSize.TINY}
              type={ButtonType.SECONDARY}
              onClick={onClickSave}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

EditTrackModal.propTypes = {
  visible: PropTypes.bool,
  title: PropTypes.string,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
  metadata: PropTypes.object,

  /** Whether to show the unlisted/public button the modal */
  showUnlistedToggle: PropTypes.bool,

  /** An array of type StemUpload */
  stems: PropTypes.array,

  /** function of type (category, trackIndex, stemIndex) */
  onSelectStemCategory: PropTypes.func,

  /** function of type (selectedIndex, trackIndex) */
  onAddStems: PropTypes.func,

  /** function of type (index) => void */
  onDeleteStem: PropTypes.func
}

EditTrackModal.defaultProps = {
  visible: true,
  title: 'EDIT TRACK',
  onCancel: () => {},
  onSave: () => {},
  onDelete: () => {},
  metadata: schemas.newTrackMetadata(),
  showUnlistedToggle: true
}

export default EditTrackModal
