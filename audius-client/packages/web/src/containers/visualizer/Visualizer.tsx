import React, { Suspense, useEffect, useState, useCallback } from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { AppState } from 'store/types'
import { getIsVisible } from './store/selectors'
import { toggleVisibility } from './store/slice'

import styles from './Visualizer.module.css'
import lazyWithPreload from 'utils/lazyWithPreload'
import { useLocation } from 'react-router-dom'
import { UPLOAD_PAGE, UPLOAD_ALBUM_PAGE, UPLOAD_PLAYLIST_PAGE } from 'utils/route'
import useHotkeys from 'hooks/useHotkey'

const NO_VISUALIZER_ROUTES = new Set([UPLOAD_PAGE, UPLOAD_ALBUM_PAGE, UPLOAD_PLAYLIST_PAGE])

// Fetch the visualizer 1s after initial load
const VisualizerProvider = lazyWithPreload(() => import('./VisualizerProvider'))

type VisualizerProps = {
} & ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const Visualizer = ({
  isVisible,
  toggleVisibility
}: VisualizerProps) => {
  useEffect(() => {
    // Begins preload when this component mounts
    VisualizerProvider.preload()
  }, [])

  // Whether or not the visualizer has been displayed ever
  const [hasDisplayed, setHasDisplayed] = useState(false)

  useEffect(() => {
    if (isVisible && !hasDisplayed) setHasDisplayed(true)
  }, [isVisible, hasDisplayed, setHasDisplayed])

  const { pathname } = useLocation()

  const onToggleVisibility = useCallback(() => {
    // Don't toggle in the case that we are on a route that disables the visualizer
    if (NO_VISUALIZER_ROUTES.has(pathname)) return

    toggleVisibility()
  }, [toggleVisibility, pathname])

  useHotkeys({
    86 /* v */: onToggleVisibility
  })

  return (
    <Suspense fallback={<div className={styles.fallback} />}>
      { hasDisplayed &&
          <VisualizerProvider visualizerVisible={isVisible} />
      }
    </Suspense>
  )
}

function mapStateToProps (state: AppState) {
  return {
    isVisible: getIsVisible(state),
  }
}

function mapDispatchToProps (dispatch: Dispatch) {
  return {
    toggleVisibility: () => dispatch(toggleVisibility()),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Visualizer)
