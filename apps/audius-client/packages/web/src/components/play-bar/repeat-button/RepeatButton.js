import { Component } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import Lottie from 'react-lottie'

import styles from '../PlayBarButton.module.css'

const RepeatStates = Object.freeze({
  OFF: 0,
  ANIMATE_OFF_ALL: 1,
  ALL: 2,
  ANIMATE_ALL_SINGLE: 3,
  SINGLE: 4,
  ANIMATE_SINGLE_OFF: 5
})

const REPEAT_STATE_LS_KEY = 'repeatState'
const getRepeatState = (defaultState) => {
  const localStorageRepeatState =
    window.localStorage.getItem(REPEAT_STATE_LS_KEY)
  if (localStorageRepeatState === null) {
    window.localStorage.setItem(REPEAT_STATE_LS_KEY, defaultState)
    return defaultState
  } else {
    return parseInt(localStorageRepeatState)
  }
}
class RepeatButton extends Component {
  constructor(props) {
    super(props)
    this.state = {
      repeatState: getRepeatState(RepeatStates.OFF),
      isPaused: true,
      icon: props.animations ? props.animations.pbIconRepeatAll : null
    }
  }

  componentDidMount() {
    this.handleChange(this.state.repeatState)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.animations !== this.props.animations) {
      this.handleChange(this.state.repeatState)
    }
  }

  handleChange = (repeatState) => {
    const { pbIconRepeatAll, pbIconRepeatSingle, pbIconRepeatOff } =
      this.props.animations
    // Go to the next state.
    let icon, isPaused
    switch (repeatState) {
      case RepeatStates.OFF:
        this.props.repeatOff()
        icon = pbIconRepeatAll
        isPaused = true
        break
      case RepeatStates.ANIMATE_OFF_ALL:
        icon = pbIconRepeatAll
        isPaused = false
        break
      case RepeatStates.ALL:
        this.props.repeatAll()
        icon = pbIconRepeatSingle
        isPaused = true
        break
      case RepeatStates.ANIMATE_ALL_SINGLE:
        icon = pbIconRepeatSingle
        isPaused = false
        break
      case RepeatStates.SINGLE:
        this.props.repeatSingle()
        icon = pbIconRepeatOff
        isPaused = true
        break
      case RepeatStates.ANIMATE_SINGLE_OFF:
        icon = pbIconRepeatOff
        isPaused = false
        break
      // Should never fire.
      default:
        icon = pbIconRepeatAll
        isPaused = true
    }
    window.localStorage.setItem(REPEAT_STATE_LS_KEY, repeatState)
    this.setState({
      icon,
      isPaused,
      repeatState
    })
  }

  nextState = () => {
    const repeatState =
      (this.state.repeatState + 1) % Object.keys(RepeatStates).length
    this.handleChange(repeatState)
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
          [styles.repeat]: this.props.isMobile
        })}
        onClick={this.nextState}>
        <Lottie
          options={animationOptions}
          eventListeners={eventListeners}
          isPaused={this.state.isPaused}
        />
      </button>
    )
  }
}

RepeatButton.propTypes = {
  animations: PropTypes.object,
  repeatOff: PropTypes.func,
  repeatSingle: PropTypes.func,
  repeatAll: PropTypes.func,
  isMobile: PropTypes.bool
}

RepeatButton.defaultProps = {
  repeatOff: () => {},
  repeatSingle: () => {},
  repeatAll: () => {}
}

export default RepeatButton
