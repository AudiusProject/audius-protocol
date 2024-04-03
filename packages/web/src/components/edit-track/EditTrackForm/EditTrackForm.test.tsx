import { ThemeProvider } from '@audius/harmony'
import { describe, it, expect } from 'vitest'

// import { render, screen } from '@testing-library/react'
import { render, screen } from '@audius/test'

import { EditTrackForm } from './EditTrackForm'

describe('EditTrackForm', () => {
  it('renders correctly', () => {
    render(
      <ThemeProvider theme='day'>
        <EditTrackForm />
      </ThemeProvider>
    )
    expect(
      screen.getByRole('heading', { name: /edit track/i, level: 1 })
    ).toBeInTheDocument()
  })
})
