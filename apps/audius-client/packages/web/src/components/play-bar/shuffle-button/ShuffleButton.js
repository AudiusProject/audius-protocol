import { Component } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import Lottie from 'react-lottie'

import styles from '../PlayBarButton.module.css'

const ShuffleStates = Object.freeze({
  OFF: 0,
  ANIMATE_OFF_ON: 1,
  ON: 2,
  ANIMATE_ON_OFF: 3
})

const SHUFFLE_STATE_LS_KEY = 'shuffleState'
const getShuffleState = (defaultState) => {
  const localStorageShuffleState =
    window.localStorage.getItem(SHUFFLE_STATE_LS_KEY)
  if (localStorageShuffleState === null) {
    window.localStorage.setItem(SHUFFLE_STATE_LS_KEY, defaultState)
    return defaultState
  } else {
    return parseInt(localStorageShuffleState)
  }
}

class ShuffleButton extends Component {
  constructor(props) {
    super(props)
    this.state = {
      shuffleState: getShuffleState(ShuffleStates.OFF),
      isPaused: true,
      icon: props.animations ? props.animations.pbIconShuffleOn : null
    }
  }

  componentDidMount() {
    this.handleChange(this.state.shuffleState)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.animations !== this.props.animations) {
      this.handleChange(this.state.shuffleState)
    }
  }

  handleChange = (shuffleState) => {
    const { pbIconShuffleOff, pbIconShuffleOn } = this.props.animations
    // Go to the next state.
    let icon, isPaused
    switch (shuffleState) {
      case ShuffleStates.OFF:
        this.props.shuffleOff()
        icon = pbIconShuffleOn
        isPaused = true
        break
      case ShuffleStates.ANIMATE_OFF_ON:
        icon = pbIconShuffleOn
        isPaused = false
        break
      case ShuffleStates.ON:
        this.props.shuffleOn()
        icon = pbIconShuffleOff
        isPaused = true
        break
      case ShuffleStates.ANIMATE_ON_OFF:
        icon = pbIconShuffleOff
        isPaused = false
        break
      // Should never fire.
      default:
        icon = pbIconShuffleOn
        isPaused = true
    }
    window.localStorage.setItem(SHUFFLE_STATE_LS_KEY, shuffleState)
    this.setState({
      icon,
      isPaused,
      shuffleState
    })
  }

  nextState = () => {
    const shuffleState =
      (this.state.shuffleState + 1) % Object.keys(ShuffleStates).length
    this.handleChange(shuffleState)
  }

  render() {
    // Listen for completion and bump the state again.
    const eventListeners = [
      {
        eventName: 'complete',
        callback: () => this.nextState()
      }
    ]
    const animationOptions = {
      loop: false,
      autoplay: false,
      animationData: this.state.icon
    }

    return (
      <button
        className={cn(styles.button, {
          [styles.buttonFixedSize]: this.props.isMobile,
          [styles.shuffle]: this.props.isMobile
        })}
        onClick={this.nextState}
      >
        <Lottie
          options={animationOptions}
          eventListeners={eventListeners}
          isPaused={this.state.isPaused}
        />
      </button>
    )
  }
}

ShuffleButton.propTypes = {
  shuffleOff: PropTypes.func,
  shuffleOn: PropTypes.func,
  isMobile: PropTypes.bool
}

ShuffleButton.defaultProps = {
  shuffleOff: () => {},
  shuffleOn: () => {}
}

export default ShuffleButton
