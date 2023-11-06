import { Component } from 'react'

import PropTypes from 'prop-types'

import IconStop from 'assets/img/iconStop.svg'
import IconPlay from 'assets/img/pbIconPlay.svg'

import styles from './PreviewButton.module.css'

class PreviewButton extends Component {
  render() {
    const { playing, onClick } = this.props

    return (
      <div onClick={onClick} className={styles.preview}>
        {playing ? (
          <div>
            <IconStop className={styles.previewButton} />
          </div>
        ) : (
          <div>
            <IconPlay className={styles.previewButton} />
          </div>
        )}
        <span>Preview</span>
      </div>
    )
  }
}

PreviewButton.propTypes = {
  playing: PropTypes.bool,
  onClick: PropTypes.func
}

PreviewButton.defaultProps = {
  playing: false
}

export default PreviewButton
