// This file is used to configure all stories
import { addParameters } from '@storybook/client-api'

import 'assets/styles/colors.css'
import 'assets/styles/fonts.css'
import 'assets/styles/sizes.css'
import 'assets/styles/animations.css'
import 'react-perfect-scrollbar/dist/css/styles.css'
import 'assets/styles/transforms.css'

// Default to docs view
addParameters({
  viewMode: 'docs'
})
