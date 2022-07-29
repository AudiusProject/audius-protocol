import { Component } from 'react'

import {
  Button,
  ButtonType,
  ButtonSize,
  IconKebabVertical
} from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'

import { ReactComponent as IconDrag } from 'assets/img/iconDrag.svg'
import {
  GENRES,
  ELECTRONIC_PREFIX,
  getCanonicalName
} from 'common/utils/genres'
import DropdownInput from 'components/data-entry/DropdownInput'
import LabeledInput from 'components/data-entry/LabeledInput'
import TagInput from 'components/data-entry/TagInput'
import PreviewButton from 'components/upload/PreviewButton'
import { moodMap } from 'utils/moods'

import styles from './InlineFormTile.module.css'

const MOODS = Object.keys(moodMap).map((k) => ({ text: k, el: moodMap[k] }))

class InlineFormTile extends Component {
  state = {
    advancedVisible: false
  }

  toggleAdvancedVisible = () => {
    this.setState({ advancedVisible: !this.state.advancedVisible })
  }

  render() {
    const {
      defaultFields,
      playing,
      onPlayPreview,
      onStopPreview,
      onChangeField,
      advancedVisible = this.state.advancedVisible
    } = this.props

    return (
      <div className={styles.inlineFormTile}>
        <div className={styles.basic}>
          <div className={styles.handle}>
            <IconDrag />
          </div>
          <div className={styles.trackName}>
            <LabeledInput
              placeholder='What should we call this track?'
              label='Track Name'
              size='small'
              layout='horizontal'
              defaultValue={defaultFields.title}
              onChange={(value) => onChangeField('title', value)}
            />
          </div>
          <div>
            <PreviewButton
              playing={playing}
              onClick={playing ? onStopPreview : onPlayPreview}
            />
          </div>
          <div>
            <Button
              className={styles.moreButton}
              textClassName={styles.moreButtonText}
              iconClassName={styles.moreButtonIcon}
              type={ButtonType.COMMON_ALT}
              size={ButtonSize.SMALL}
              text={advancedVisible ? 'LESS' : 'MORE'}
              leftIcon={<IconKebabVertical />}
              onClick={this.toggleAdvancedVisible}
            />
          </div>
        </div>
        <div
          className={cn(styles.advanced, { [styles.show]: advancedVisible })}
        >
          <div className={styles.row}>
            <DropdownInput
              placeholder='What is the Genre?'
              menu={{ items: GENRES }}
              defaultValue={getCanonicalName(defaultFields.genre) || ''}
              label='Genre'
              labelStyle={styles.label}
              layout='horizontal'
              size='medium'
              onSelect={(value) =>
                onChangeField('genre', value.replace(ELECTRONIC_PREFIX, ''))
              }
            />
            <DropdownInput
              placeholder='Describe the mood of your track, e.g. Upbeat'
              menu={{ items: MOODS }}
              defaultValue={defaultFields.genre || ''}
              label='Mood'
              labelStyle={styles.label}
              layout='horizontal'
              size='medium'
              onSelect={(value) => onChangeField('mood', value)}
            />
          </div>
          <div className={styles.row}>
            <LabeledInput
              placeholder='e.g. CC-XXX-YY-NNNNNN'
              label='Track ISRC'
              size='small'
              labelStyle={styles.label}
              layout='horizontal'
              onChange={(value) => onChangeField('isrc', value)}
            />
            <LabeledInput
              placeholder='e.g. T-345246800-1'
              label='Track ISWC'
              size='small'
              labelStyle={styles.label}
              layout='horizontal'
              onChange={(value) => onChangeField('iswc', value)}
            />
          </div>
          <div className={styles.row}>
            <TagInput
              size='small'
              label='Tags'
              labelStyle={styles.label}
              layout='horizontal'
              onChangeTags={(value) =>
                onChangeField('tags', [...value].join(','))
              }
            />
          </div>
        </div>
      </div>
    )
  }
}

InlineFormTile.propTypes = {
  defaultFields: PropTypes.object,
  playing: PropTypes.bool,
  onChangeField: PropTypes.func,
  onPlayPreview: PropTypes.func,
  onStopPreview: PropTypes.func
}

InlineFormTile.defaultProps = {
  playing: false,
  onPlayPreview: () => {},
  onStopPreview: () => {},
  onChangeField: () => {}
}

export default InlineFormTile
