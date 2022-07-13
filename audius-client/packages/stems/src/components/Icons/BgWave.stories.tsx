import { SVGAttributes } from 'react'

import { Story } from '@storybook/react'

import {
  BgWaveSmall as BgWaveSmallComponent,
  BgWaveLarge as BgWaveLargeComponent
} from '.'

export default {
  component: BgWaveSmallComponent,
  title: 'Foundations/SVG Backgrounds'
}

export const BgWaveLarge: Story<SVGAttributes<SVGElement>> = (args) => {
  return <BgWaveLargeComponent {...args} />
}

BgWaveLarge.parameters = {
  docs: {
    source: {
      code: 'import { BgWaveLarge } from @audius/stems\n// Render the SVG element: <BgWaveLarge />'
    }
  }
}
BgWaveLarge.storyName = 'BgWaveLarge'

export const BgWaveSmall: Story<SVGAttributes<SVGElement>> = (args) => {
  return <BgWaveSmallComponent {...args} />
}

BgWaveSmall.parameters = {
  docs: {
    source: {
      code: 'import { BgWaveSmall } from @audius/stems\n// Render the SVG element: <BgWaveSmall />'
    }
  }
}
BgWaveSmall.storyName = 'BgWaveSmall'
