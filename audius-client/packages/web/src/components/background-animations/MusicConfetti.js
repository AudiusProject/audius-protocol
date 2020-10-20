/* global Image */
import React, { useRef, useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
// import styles from './MusicConfetti.module.css'
import heartIconPrimary from 'assets/img/particles/particleHeartPrimary.svg'
import heartIconSecondary from 'assets/img/particles/particleHeartSecondary.svg'
import noteIconSecondary from 'assets/img/particles/particleNoteSecondary.svg'
import noteIconPrimary from 'assets/img/particles/particleNotePrimary.svg'
import listensIconPrimary from 'assets/img/particles/particleListensPrimary.svg'
import listensIconSecondary from 'assets/img/particles/particleListensSecondary.svg'
import playlistsIconPrimary from 'assets/img/particles/particlePlaylistPrimary.svg'
import playlistsIconSecondary from 'assets/img/particles/particlePlaylistSecondary.svg'

import Confetti from 'utils/animations/music-confetti'
import { useOnResizeEffect } from 'utils/effects'

async function startConfettiAnimation(
  canvasRef,
  recycle,
  limit,
  friction,
  gravity,
  rotate,
  swing,
  particleRate,
  onCompletion
) {
  if (!canvasRef) return
  const images = [
    heartIconPrimary,
    heartIconSecondary,
    noteIconSecondary,
    noteIconPrimary,
    listensIconPrimary,
    listensIconSecondary,
    playlistsIconPrimary,
    playlistsIconSecondary
  ].map(icon => {
    const img = new Image()
    img.src = icon
    return img
  })
  await Promise.all(
    images.map(
      img =>
        new Promise((resolve, reject) => {
          img.onload = () => {
            resolve(true)
          }
        })
    )
  )

  const confetti = new Confetti(
    canvasRef,
    images,
    recycle,
    limit,
    friction,
    gravity,
    rotate,
    swing,
    particleRate,
    onCompletion
  )
  confetti.run()
  return confetti
}

const MusicConfetti = props => {
  // Check if browser is Safari, Edge, or IE
  if (
    (navigator.userAgent.includes('Safari') &&
      !navigator.userAgent.includes('Chrome')) ||
    navigator.userAgent.includes('Edge' || navigator.userAgent.includes('MSIE'))
  ) {
    return null
  }
  return <UnconditionalMusicConfetti {...props} />
}

const UnconditionalMusicConfetti = props => {
  const confettiPromiseRef = useRef(null)

  // When we mount canvas, start confetti and set the confettiPromiseRef
  const {
    recycle,
    limit,
    friction,
    gravity,
    rotate,
    swing,
    particleRate,
    onCompletion
  } = props
  const setCanvasRef = useCallback(
    node => {
      if (!node) return
      const confetti = startConfettiAnimation(
        node,
        recycle,
        limit,
        friction,
        gravity,
        rotate,
        swing,
        particleRate,
        onCompletion
      )
      confettiPromiseRef.current = confetti
    },
    [
      recycle,
      limit,
      friction,
      gravity,
      rotate,
      swing,
      particleRate,
      onCompletion
    ]
  )

  // When we unmount, stop the canvas animation
  useEffect(() => {
    return () => {
      if (confettiPromiseRef.current) {
        confettiPromiseRef.current.then(animation =>
          animation ? animation.stop() : null
        )
      }
    }
  }, [])

  const [sizing, setSize] = useState({})

  useEffect(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight
    })
  }, [])

  useOnResizeEffect(() => {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight
    })
  })
  return (
    <canvas
      ref={setCanvasRef}
      {...sizing}
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: props.zIndex,
        width: '100vw',
        height: '100vh',
        ...(props.withBackground
          ? {
              background:
                'radial-gradient(circle at top left, #B749D6 0%, #6516A3 100%)'
            }
          : {})
      }}
    />
  )
}

MusicConfetti.propTypes = {
  withBackground: PropTypes.bool,
  recycle: PropTypes.bool,
  limit: PropTypes.number,
  friction: PropTypes.number,
  gravity: PropTypes.number,
  rotate: PropTypes.number,
  swing: PropTypes.number,
  particleRate: PropTypes.number,
  zIndex: PropTypes.number,
  onCompletion: PropTypes.func
}

MusicConfetti.defaultProps = {
  withBackground: false,
  recycle: false,
  limit: 250,
  friction: 0.99,
  gravity: 0.2,
  rotate: 0.1,
  swing: 0.01,
  particleRate: 0.1,
  zIndex: 16
}

export default MusicConfetti
