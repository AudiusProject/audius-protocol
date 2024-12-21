import { Component } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import Lottie from 'react-lottie'

import pbIconPause from 'assets/animations/pbIconPause.json'
import pbIconPlay from 'assets/animations/pbIconPlay.json'
import pbLoadingSpinner from 'assets/animations/pbLoadingSpinner.json'

import styles from './PlayBarButton.module.css'

const PlayStates = Object.freeze({
  PAUSE: 0,
  ANIMATE_PAUSE_PLAY: 1,
  PLAY: 2,
  ANIMATE_PLAY_PAUSE: 3
})

class PlayButton extends Component {
  state = {
    playState: PlayStates.PLAY,
    isPaused: true,
    icon: pbIconPlay
  }

  componentDidMount() {
    if (this.props.status === 'pause') {
      this.setState({
        icon: pbIconPause,
        playState: PlayStates.PAUSE
      })
    }
  }

  componentDidUpdate(prevProps) {
    const { status } = this.props

    if (status !== prevProps.status) {
      let icon, isPaused, playState

      if (status === 'play' && this.state.playState !== PlayStates.PLAY) {
        if (prevProps.status === 'load') {
          icon = pbIconPlay
          isPaused = true
          playState = PlayStates.PLAY
        } else {
          icon = pbIconPause
          isPaused = false
          playState = PlayStates.ANIMATE_PAUSE_PLAY
        }
      }
      if (status === 'pause' && this.state.playState !== PlayStates.PAUSE) {
        if (prevProps.status === 'load') {
          icon = pbIconPause
          isPaused = true
          playState = PlayStates.PAUSE
        } else {
          icon = pbIconPlay
          isPaused = false
          playState = PlayStates.ANIMATE_PLAY_PAUSE
        }
      }

      this.setState({ icon, isPaused, playState })
    }
  }

  handleChange = () => {
    // Go to the next state.
    let icon, isPaused

    const playState =
      (this.state.playState + 1) % Object.keys(PlayStates).length
    switch (playState) {
      case PlayStates.PLAY:
        icon = pbIconPlay
        isPaused = true
        break
      case PlayStates.ANIMATE_PLAY_PAUSE:
        icon = pbIconPlay
        isPaused = false
        break
      case PlayStates.PAUSE:
        icon = pbIconPause
        isPaused = true
        break
      case PlayStates.ANIMATE_PAUSE_PLAY:
        icon = pbIconPause
        isPaused = false
        break
      // Should never fire.
      default:
        icon = pbIconPlay
        isPaused = true
    }

    this.setState({
      icon,
      isPaused,
      playState
    })
  }

  onClick = () => {
    if (this.props.playable) {
      this.handleChange()
      this.props.onClick()
    }
  }

  render() {
    const { status } = this.props
    const { playState } = this.state

    // Listen for completion and bump the state again.
    const eventListeners = [
      {
        eventName: 'complete',
        callback: () => this.handleChange()
      }
    ]

    const isLoading = status === 'load'

    let data, isPaused
    let loop = false
    if (isLoading) {
      data = pbLoadingSpinner
      isPaused = false
      loop = true
    } else {
      data = this.state.icon
      isPaused = this.state.isPaused
    }
    const animationOptions = {
      loop,
      autoplay: false,
      animationData: data
    }

    const animation = (
      <div className={styles.animation}>
        <Lottie
          ariaRole={null}
          ariaLabel={null}
          options={animationOptions}
          eventListeners={eventListeners}
          isPaused={isPaused}
        />
      </div>
    )

    const ariaLabel = isLoading
      ? 'track loading'
      : playState === PlayStates.PLAY
        ? 'play track'
        : 'pause track'

    return (
      <button
        aria-label={ariaLabel}
        className={cn(styles.button, styles.playButton)}
        onClick={this.onClick}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {animation}
      </button>
    )
  }
}

PlayButton.propTypes = {
  // Whether or not there is something playable in view
  playable: PropTypes.bool,
  status: PropTypes.oneOf(['play', 'pause', 'load']),
  onClick: PropTypes.func
}

PlayButton.defaultProps = {
  playable: true,
  status: 'play',
  onClick: () => {}
}

export default PlayButton
