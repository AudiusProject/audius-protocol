import { SVGAttributes } from 'react'

import { Story } from '@storybook/react'

import * as icons from './'

export default {
  component: icons.IconAlbum,
  title: 'Foundations/Icons'
}

const exclusions = new Set(['BgWaveSmall', 'BgWaveLarge'])

export const All: Story<SVGAttributes<SVGElement>> = (args) => {
  return (
    <>
      <p>
        Icons are <code>svg</code> elements and can accept any <code>svg</code>{' '}
        attributes.
      </p>
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
        {Object.entries(icons).map(([name, exported]) => {
          if (exclusions.has(name)) return null
          const Icon = exported
          return (
            <div key={name} style={{ margin: 24 }}>
              <div>
                <b>{name}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: 8 }}>
                  <Icon height={50} width={50} {...args} />
                </div>
                <div style={{ background: 'black', padding: 8 }}>
                  <Icon height={50} width={50} {...args} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

All.parameters = {
  a11y: {
    // Disable a11y since this Story is just to show all the available icons.
    disable: true
  },
  docs: {
    source: {
      code: `// Usage:\n// import { ICON_NAME_HERE } from '@audius/stems'\nimport { IconAlbum } from '@audius/stems'\n\n// Rendering the svg element:\n<IconAlbum />
      `
    }
  }
}
