import { Component } from 'react'

import { UploadType } from '@audius/common'
import { Button, ButtonType, IconArrow } from '@audius/stems'
import { mapValues } from 'lodash'
import PropTypes from 'prop-types'

import FormTile from 'components/data-entry/FormTile'
import InlineFormTile from 'components/data-entry/InlineFormTile'

import styles from './EditPage.module.css'

class EditPage extends Component {
  state = {
    invalidTracksFields: this.props.tracks.map((track) =>
      mapValues(track.metadata, (v) => false)
    ),
    invalidCollectionFields: mapValues(this.props.metadata, (v) => false)
  }

  componentWillUnmount() {
    this.props.onStopPreview()
  }

  getRequiredTracksFields = (tracks) => {
    return this.props.tracks.map((track) => {
      const fields = mapValues(track.metadata, (v) => false)
      fields.title = true
      if (
        this.props.uploadType === UploadType.INDIVIDUAL_TRACK ||
        this.props.uploadType === UploadType.INDIVIDUAL_TRACKS
      ) {
        fields.genre = true
        fields.artwork = true
      }
      return fields
    })
  }

  getRequiredCollectionFields = (metadata) => {
    const fields = mapValues(metadata, (v) => false)
    fields.playlist_name = true
    fields.genre = true
    fields.artwork = true
    return fields
  }

  validateTracksFields = (tracks) => {
    const { uploadType } = this.props

    const newInvalidTracksFields = [...this.state.invalidTracksFields]
    const validTracks = tracks.map((track, i) => {
      newInvalidTracksFields[i] = {
        ...this.state.invalidTracksFields[i],
        title: !track.metadata.title
      }
      if (
        uploadType === UploadType.INDIVIDUAL_TRACK ||
        uploadType === UploadType.INDIVIDUAL_TRACKS
      ) {
        newInvalidTracksFields[i].genre = !track.metadata.genre
        newInvalidTracksFields[i].artwork = !track.metadata.artwork.file
        const { premium_conditions: premiumConditions } = track.metadata
        newInvalidTracksFields[i].premium_conditions =
          premiumConditions &&
          'nft_collection' in premiumConditions &&
          !premiumConditions.nft_collection
      }
      return Object.values(newInvalidTracksFields[i]).every((f) => !f)
    })

    this.setState(
      {
        invalidTracksFields: newInvalidTracksFields
      },
      () => {
        const unlistedVisibilityFields = [
          'genre',
          'mood',
          'tags',
          'share',
          'play_count'
        ]
        for (let i = 0; i < tracks.length; i += 1) {
          const track = tracks[i]

          // If track is premium, set remixes to false
          const isPremium = track.metadata.is_premium
          const remixes = isPremium
            ? false
            : track.metadata.field_visibility.remixes

          // If track is not unlisted and one of the unlisted visibility fields is false, set to true
          const isUnlisted = track.metadata.is_unlisted
          const genre = !isUnlisted
            ? true
            : track.metadata.field_visibility.genre
          const mood = !isUnlisted ? true : track.metadata.field_visibility.mood
          const tags = !isUnlisted ? true : track.metadata.field_visibility.tags
          const share = !isUnlisted
            ? true
            : track.metadata.field_visibility.share
          const play_count = !isUnlisted
            ? true
            : track.metadata.field_visibility.play_count

          if (
            isPremium ||
            (!isUnlisted &&
              !unlistedVisibilityFields.every(
                (field) => track.metadata.field_visibility[field]
              ))
          ) {
            this.updateTrack(
              'field_visibility',
              {
                genre,
                mood,
                tags,
                share,
                play_count,
                remixes
              },
              false,
              i
            )
          }
        }
      }
    )
    return validTracks.every((f) => f)
  }

  validateCollectionFields = (formFields) => {
    const newInvalidCollectionFields = {
      ...this.state.invalidCollectionFields,
      playlist_name: !formFields.playlist_name,
      genre: !formFields.genre,
      artwork: !formFields.artwork.file
    }
    this.setState({
      invalidCollectionFields: newInvalidCollectionFields
    })
    return Object.values(newInvalidCollectionFields).every((f) => !f)
  }

  onContinue = () => {
    const { uploadType } = this.props

    let validCollectionFields = true
    if (uploadType === UploadType.PLAYLIST || uploadType === UploadType.ALBUM) {
      validCollectionFields = this.validateCollectionFields(this.props.metadata)
    }
    const validTracksFields = this.validateTracksFields(this.props.tracks)
    if (validTracksFields && validCollectionFields) {
      this.props.onContinue()
    }
  }

  updateMetadata = (field, value, invalid) => {
    const { invalidCollectionFields } = this.state
    invalidCollectionFields[field] = !!invalid
    this.setState({ invalidCollectionFields })
    this.props.updateMetadata(field, value)
  }

  updateTrack = (field, value, invalid, i) => {
    const { invalidTracksFields } = this.state
    invalidTracksFields[i][field] = !!invalid
    this.setState({ invalidTracksFields })
    this.props.updateTrack(field, value, i)
  }

  render() {
    const {
      metadata,
      tracks,
      uploadType,
      previewIndex,
      onPlayPreview,
      onStopPreview,
      onChangeOrder
    } = this.props

    const { invalidTracksFields, invalidCollectionFields } = this.state

    const requiredTracksFields = this.getRequiredTracksFields(this.props.tracks)
    const requiredCollectionFields = this.getRequiredCollectionFields(
      this.props.metadata
    )

    let forms
    if (uploadType === UploadType.PLAYLIST || uploadType === UploadType.ALBUM) {
      forms = (
        <div className={styles.formTile}>
          <FormTile
            defaultFields={metadata}
            invalidFields={invalidCollectionFields}
            requiredFields={requiredCollectionFields}
            isPlaylist
            type={uploadType === UploadType.PLAYLIST ? 'playlist' : 'album'}
            onChangeField={(field, value, invalid) =>
              this.updateMetadata(field, value, invalid)
            }
            onChangeOrder={(source, destination) =>
              onChangeOrder(source, destination)
            }
          >
            {tracks.map((track, i) => (
              <InlineFormTile
                key={i}
                defaultFields={track.metadata}
                invalidFields={invalidTracksFields[i]}
                requiredFields={requiredTracksFields[i]}
                trackLength={track.preview.duration}
                playing={i === previewIndex}
                onPlayPreview={() => onPlayPreview(i)}
                onStopPreview={() => onStopPreview()}
                onChangeField={(field, value, invalid = false) =>
                  this.updateTrack(field, value, invalid, i)
                }
              />
            ))}
          </FormTile>
        </div>
      )
    } else {
      forms = tracks.map((track, i) => (
        <div key={track.file.preview + i} className={styles.formTile}>
          <FormTile
            defaultFields={track.metadata}
            invalidFields={invalidTracksFields[i]}
            requiredFields={requiredTracksFields[i]}
            playing={i === previewIndex}
            type={'track'}
            onAddStems={(stems) => this.props.onAddStems(stems, i)}
            onSelectStemCategory={(category, stemIndex) =>
              this.props.onSelectStemCategory(category, i, stemIndex)
            }
            onDeleteStem={(stemIndex) => this.props.onDeleteStem(i, stemIndex)}
            trackLength={track.preview.duration}
            stems={this.props.stems[i]}
            onPlayPreview={() => onPlayPreview(i)}
            onStopPreview={() => onStopPreview()}
            onChangeField={(field, value, invalid) =>
              this.updateTrack(field, value, invalid, i)
            }
          />
        </div>
      ))
    }

    return (
      <div className={styles.edit}>
        {forms}
        <div className={styles.continue}>
          <Button
            type={ButtonType.PRIMARY_ALT}
            text='Continue'
            name='continue'
            rightIcon={<IconArrow />}
            onClick={this.onContinue}
            textClassName={styles.continueButtonText}
            className={styles.continueButton}
          />
        </div>
      </div>
    )
  }
}

EditPage.propTypes = {
  tracks: PropTypes.array,
  uploadType: PropTypes.oneOf(Object.values(UploadType)),
  previewIndex: PropTypes.number,
  onPlayPreview: PropTypes.func,
  onStopPreview: PropTypes.func,
  updateTrack: PropTypes.func,
  updateMetadata: PropTypes.func,
  onContinue: PropTypes.func,
  onAddStems: PropTypes.func,
  stems: PropTypes.array,

  /** Function of type (trackIndex, stemIndex) => void */
  onDeleteStem: PropTypes.func
}

export default EditPage
