import { describe, it, expect } from 'vitest'

import { render, screen } from 'test/test-utils'

import { EditTrackForm } from './EditTrackForm'

describe('EditTrackForm', () => {
  it('renders correctly', () => {
    render(<EditTrackForm />)
    expect(
      screen.getByRole('heading', { name: /edit track/i, level: 1 })
    ).toBeInTheDocument()
  })
})
