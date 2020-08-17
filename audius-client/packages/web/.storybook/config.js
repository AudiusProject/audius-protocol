import React from 'react'
import { configure, addDecorator } from '@storybook/react';
import { withOptions } from '@storybook/addon-options';
import { withKnobs } from '@storybook/addon-knobs';
import { withInfo } from '@storybook/addon-info';
import { withSmartKnobs } from 'storybook-addon-smart-knobs'

addDecorator(
  withOptions({
    name: 'Audius Storybook',
    url: '#',
    hierarchySeparator: null,
    hierarchyRootSeparator: null,
    enableShortcuts: false,
    theme: {
      mainBackground: '#F7F7F7 linear-gradient(to bottom right, #EEEEEE, #FFFFFF)',
      mainBorder: '1px solid rgba(0,0,0,0.1)',
      mainBorderColor: 'rgba(0,0,0,0.1)',
      mainBorderRadius: 4,
      mainFill: 'rgba(255,255,255,0.89)',
      barFill: 'rgba(255,255,255,1)',
      barSelectedColor: 'rgba(0,0,0,0.1)',
      inputFill: 'rgba(0,0,0,0.05)',
      mainTextFace: '"Avenir Next LT Pro", sans-serif !important',
      dimmedTextColor: 'rgba(0,0,0,0.4)',
      highlightColor: '#9fdaff',
      successColor: '#09833a',
      failColor: '#d53535',
      warnColor: 'orange',
      mainTextSize: 13,
      layoutMargin: 10,
      overlayBackground:
        'linear-gradient(to bottom right, rgba(233, 233, 233, 0.6), rgba(255, 255, 255, 0.8))',
      treeArrow: {
        base: {
          display: 'none',
        },
      },
      treeMenuHeader: {
        color: '#999',
        fontWeight: '700',
        fontSize: '16px',
        padding: '4px',
        marginBottom: '4px',
      },
      menuLink: {
        color: '#999',
        fontWeight: '500',
        fontSize: '12px',
        padding: '4px',
        marginBottom: '4px',
      },
      activeMenuLink: {
        background: 'none',
        color: '#333'
      }
    },
  })
)
addDecorator(withInfo)
addDecorator(
  withKnobs
)
addDecorator(
  withSmartKnobs
)
addDecorator(story => <div className='stories'>{story()}</div>)

function loadStories() {
  require('../src/stories');
}

configure(loadStories, module);