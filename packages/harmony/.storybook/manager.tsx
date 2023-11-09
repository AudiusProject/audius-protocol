import React from 'react'
import { addons } from '@storybook/manager-api'

import { harmonyDocsThemes } from '../src/storybook/theme'
import { SidebarItem } from '../src/storybook/components/SidebarItem'

import './global.css'

addons.setConfig({
  theme: harmonyDocsThemes.day,
  sidebar: {
    renderLabel(item) {
      const { name } = item
      const statusRegex = /\[([^)]+)\]/gi
      const [statusMatch, statusType] = statusRegex.exec(name) || []

      if (!statusMatch) {
        return name
      }

      return (
        <SidebarItem name={name.replace(statusMatch, '')} status={statusType} />
      )
    }
  }
})
