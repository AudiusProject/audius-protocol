import { useRef, useState, useEffect, useCallback } from 'react'

import heartIconPrimary from 'assets/img/particles/particleHeartPrimary.svg'
import heartIconSecondary from 'assets/img/particles/particleHeartSecondary.svg'
import listensIconPrimary from 'assets/img/particles/particleListensPrimary.svg'
import listensIconSecondary from 'assets/img/particles/particleListensSecondary.svg'
import noteIconPrimary from 'assets/img/particles/particleNotePrimary.svg'
import noteIconSecondary from 'assets/img/particles/particleNoteSecondary.svg'
import playlistsIconPrimary from 'assets/img/particles/particlePlaylistPrimary.svg'
import playlistsIconSecondary from 'assets/img/particles/particlePlaylistSecondary.svg'
import Confetti from 'utils/animations/music-confetti'
import { useOnResizeEffect } from 'utils/effects'

const DEFAULT_IMAGES = [
  heartIconPrimary,
  heartIconSecondary,
  noteIconSecondary,
  noteIconPrimary,
  listensIconPrimary,
  listensIconSecondary,
  playlistsIconPrimary,
  playlistsIconSecondary
]

async function startConfettiAnimation(
  canvasRef: HTMLCanvasElement,
  recycle: boolean,
  limit: number,
  friction: number,
  gravity: number,
  rotate: number,
  swing: number,
  particleRate: number,
  onCompletion: () => void,
  isMatrix: boolean
) {
  if (!canvasRef) return
  let images = null
  if (!isMatrix) {
    images = DEFAULT_IMAGES.map((icon) => {
      const img = new Image()
      img.src = icon
      return img
    })
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            img.onload = () => {
              resolve(true)
            }
          })
      )
    )
  }

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

type MusicConfettiProps = {
  withBackground?: boolean
  recycle?: boolean
  limit?: number
  friction?: number
  gravity?: number
  rotate?: number
  swing?: number
  particleRate?: number
  zIndex?: number
  onCompletion?: () => void
  isMatrix?: boolean
}

const defaultProps: MusicConfettiProps = {
  withBackground: false,
  recycle: false,
  limit: 250,
  friction: 0.99,
  gravity: 0.2,
  rotate: 0.1,
  swing: 0.01,
  particleRate: 0.1,
  zIndex: 16,
  onCompletion: () => {},
  isMatrix: false
}

const MusicConfetti = (props: MusicConfettiProps) => {
  const newProps = { ...props } as Required<MusicConfettiProps>

  if (props.isMatrix) {
    newProps.swing = 0
    newProps.rotate = 0
  }

  return <UnconditionalMusicConfetti {...newProps} />
}

MusicConfetti.defaultProps = defaultProps

const UnconditionalMusicConfetti = (props: Required<MusicConfettiProps>) => {
  const confettiPromiseRef = useRef<Promise<Confetti | undefined> | null>(null)

  // When we mount canvas, start confetti and set the confettiPromiseRef
  const {
    recycle,
    limit,
    friction,
    gravity,
    rotate,
    swing,
    particleRate,
    onCompletion,
    isMatrix
  } = props

  const setCanvasRef = useCallback(
    (node: HTMLCanvasElement) => {
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
        onCompletion,
        isMatrix
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
      onCompletion,
      isMatrix
    ]
  )

  // When we unmount, stop the canvas animation
  useEffect(() => {
    return () => {
      if (confettiPromiseRef.current) {
        confettiPromiseRef.current.then((animation) =>
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

export default MusicConfetti
