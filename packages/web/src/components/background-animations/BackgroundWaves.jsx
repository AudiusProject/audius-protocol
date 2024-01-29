import { useRef, useEffect, useCallback } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import WaveBG from 'utils/animations/background-waves'
import { useOnResizeEffect } from 'utils/effects'

const waveConfig = [
  {
    type: 'small',
    speed: 0.8 * 0.35,
    yPos: (containerHeight, imgHeight) => 0.05 * containerHeight,
    offset: (containerWidth, imgWidth) => 150,
    opacity: 0.06
  },
  {
    type: 'large',
    speed: 3.6 * 0.35,
    yPos: (containerHeight, imgHeight) => -0.2 * containerHeight,
    offset: (containerWidth, imgWidth) => imgWidth / 3,
    opacity: 0.14
  },
  {
    type: 'large',
    speed: 2.1 * 0.35,
    yPos: (containerHeight, imgHeight) => -0.4 * containerHeight,
    offset: (containerWidth, imgWidth) => (2 / 3) * imgWidth,
    opacity: 0.09
  },
  {
    type: 'small',
    speed: 0.4 * 0.35,
    yPos: (containerHeight, imgHeight) => 0.8 * containerHeight,
    opacity: 0.06
  },
  {
    type: 'large',
    speed: 1.3 * 0.35,
    yPos: (containerHeight, imgHeight) => 0.5 * containerHeight,
    opacity: 0.09
  },
  {
    type: 'large',
    speed: 3 * 0.35,
    yPos: (containerHeight, imgHeight) => 0.65 * containerHeight,
    offset: (containerWidth, imgWidth) => imgWidth / 2,
    opacity: 0.14
  }
]

async function startWaveAnimation(canvasRef, useStatic) {
  if (!canvasRef.current) {
    return null
  }
  await WaveBG.loadResources()
  const waveBg = new WaveBG(canvasRef.current, useStatic, waveConfig)
  return waveBg
}

const BackgroundWaves = (props) => {
  // Check if browser is Safari, Edge, or IE
  let useStatic = props.useStatic
  if (
    (navigator.userAgent.includes('Safari') &&
      !navigator.userAgent.includes('Chrome')) ||
    navigator.userAgent.includes('Edge') ||
    navigator.userAgent.includes('MSIE')
  ) {
    useStatic = true
  }
  const canvasRef = useRef()
  const waveAnimation = useRef(null)

  useEffect(() => {
    waveAnimation.current = startWaveAnimation(canvasRef, useStatic)
    return () =>
      waveAnimation.current.then((animation) => {
        animation.remove()
      })
  }, [useStatic])

  useEffect(() => {
    if (waveAnimation.current) {
      waveAnimation.current.then((animation) => {
        if (props.pause) {
          animation.pause()
        } else {
          animation.start()
        }
      })
    }
  }, [props.pause])

  const resizeAnimation = useCallback(() => {
    if (waveAnimation.current) {
      waveAnimation.current.then((animation) => animation.resize())
    }
  }, [])

  useOnResizeEffect(resizeAnimation)

  return (
    <div
      ref={canvasRef}
      className={cn({ [props.className]: !!props.className })}
      css={{
        position: 'fixed',
        top: 0,
        left: 0,
        background:
          'radial-gradient(circle at top left, #B749D6 50%, #6516A3 100%)',
        width: '100%',
        minHeight: '100vh',
        height: '100%',
        zIndex: props.zIndex,
        overflowX: 'hidden',
        ...(props.canvasStyles || {})
      }}
    />
  )
}

BackgroundWaves.propTypes = {
  zIndex: PropTypes.number,
  useStatic: PropTypes.bool,
  className: PropTypes.string,
  canvasStyles: PropTypes.object,
  pause: PropTypes.bool
}

BackgroundWaves.defaultProps = {
  zIndex: 1,
  useStatic: false,
  pause: false
}

export default BackgroundWaves
