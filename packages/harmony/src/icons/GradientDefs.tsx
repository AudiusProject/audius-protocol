import { useTheme } from '@emotion/react'

// Global svg devs to reference for gradient fills
export const GradientDefs = () => {
  const { color } = useTheme()

  return (
    <svg style={{ position: 'fixed', top: '-1000px' }}>
      <defs>
        <linearGradient
          x1='85.847289%'
          y1='85.847289%'
          x2='-8.9070096%'
          y2='8.9070096%'
          id='harmony-gradient'
        >
          <stop stopColor={color.special.gradientStop1} offset='0%' />
          <stop stopColor={color.special.gradientStop2} offset='100%' />
        </linearGradient>
      </defs>
    </svg>
  )
}
