import React, { Component } from 'react'

import Slider from 'antd/lib/slider'
import PropTypes from 'prop-types'

import { ReactComponent as IconVolume0 } from 'assets/img/iconVolume0.svg'
import { ReactComponent as IconVolume1 } from 'assets/img/iconVolume1.svg'
import { ReactComponent as IconVolume2 } from 'assets/img/iconVolume2.svg'
import { ReactComponent as IconVolume3 } from 'assets/img/iconVolume3.svg'
import { setupHotkeys, ModifierKeys } from 'utils/hotkeyUtil'

import styles from './VolumeBar.module.css'

const getVolumeIcon = volumeLevel => {
  if (volumeLevel === 0) return IconVolume0
  if (volumeLevel <= 33) return IconVolume1
  if (volumeLevel <= 66) return IconVolume2
  return IconVolume3
}

const getSavedVolume = defaultVolume => {
  const localStorageVolume = window.localStorage.getItem('volume')
  if (localStorageVolume === null) {
    window.localStorage.setItem('volume', defaultVolume)
    return defaultVolume
  } else {
    return parseFloat(localStorageVolume)
  }
}

class VolumeBar extends Component {
  state = {
    volumeLevel: getSavedVolume(this.props.defaultValue)
  }

  volumeBarRef = React.createRef()

  componentDidMount() {
    const volumeUp = () => {
      this.volumeChange(Math.min(this.state.volumeLevel + 10, 100))
    }
    const volumeDown = () => {
      this.volumeChange(Math.max(this.state.volumeLevel - 10, 0))
    }
    setupHotkeys({
      38 /* up */: { cb: volumeUp, or: [ModifierKeys.CTRL, ModifierKeys.CMD] },
      40 /* down */: {
        cb: volumeDown,
        or: [ModifierKeys.CTRL, ModifierKeys.CMD]
      }
    })
    // Ensure rounded edges at the default volume (100%).
    this.volumeChange(this.state.volumeLevel)
  }

  /**
   * @param {number} value volume number to set, 0 to 100
   * @param {boolean} persist whether or not toe persist the change to local storage
   */
  volumeChange = (value, persist = true) => {
    // Round the volume bar tracker's right edge when it reaches 100%
    if (value === 100) {
      this.volumeBarRef.current
        .getElementsByClassName('ant-slider-track')[0]
        .classList.add('borderRadius')
    } else if (value < 100 && this.state.volumeLevel === 100) {
      this.volumeBarRef.current
        .getElementsByClassName('ant-slider-track')[0]
        .classList.remove('borderRadius')
    }
    if (persist) {
      window.localStorage.setItem('volume', value)
    }
    this.setState({ volumeLevel: value })
    this.props.onChange(value)
  }

  mute = () => {
    this.volumeChange(0, false)
  }

  unmute = () => {
    const unmuteVolume = Math.max(10, getSavedVolume(this.props.defaultValue))
    this.volumeChange(unmuteVolume)
  }

  onClick = () => {
    this.state.volumeLevel > 0 ? this.mute() : this.unmute()
  }

  render() {
    const { volumeLevel } = this.state
    const { granularity, defaultValue } = this.props

    const VolumeIcon = getVolumeIcon(volumeLevel)

    return (
      <div className={styles.volumeBarWrapper}>
        <VolumeIcon onClick={this.onClick} className={styles.volumeIcon} />
        <div ref={this.volumeBarRef} className={styles.volumeBar}>
          <Slider
            defaultValue={defaultValue}
            value={this.state.volumeLevel}
            max={granularity}
            tipFormatter={null}
            onChange={this.volumeChange}
          />
        </div>
      </div>
    )
  }
}

VolumeBar.propTypes = {
  defaultValue: PropTypes.number,
  onChange: PropTypes.func
}

VolumeBar.defaultProps = {
  defaultValue: 100,
  onChange: () => {}
}

export default VolumeBar
