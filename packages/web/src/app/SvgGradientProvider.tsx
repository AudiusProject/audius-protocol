import { ReactNode } from 'react'

type SvgGradientProviderProps = {
  children: ReactNode
}

export const SvgGradientProvider = (props: SvgGradientProviderProps) => {
  const { children } = props

  return (
    <>
      <svg style={{ position: 'fixed', top: '-1000px' }}>
        <defs>
          <linearGradient
            x1='85.847289%'
            y1='85.847289%'
            x2='-8.9070096%'
            y2='8.9070096%'
            id='linearGradient-1'
          >
            <stop
              stopColor='var(--harmony-gradient-color-1)'
              offset='0%'
            ></stop>
            <stop
              stopColor='var(--harmony-gradient-color-2)'
              offset='100%'
            ></stop>
          </linearGradient>
          <linearGradient
            id='matrixHeaderGradient'
            gradientTransform='rotate(323)'
            height='100%'
            width='100%'
          >
            <stop offset='0%' stopColor='#4FF069' />
            <stop offset='100%' stopColor='#09BD51' />
          </linearGradient>
        </defs>
      </svg>
      {children}
    </>
  )
}
