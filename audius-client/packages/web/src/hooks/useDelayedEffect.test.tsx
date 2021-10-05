import React, { useState } from 'react'

import { render, fireEvent, screen, act } from '@testing-library/react'

import { useDelayedEffect } from './useDelayedEffect'

const TestComponent = () => {
  const [string, setString] = useState('initial')
  const [didClick, setDidClick] = useState(false)
  useDelayedEffect({
    callback: () => act(() => setString('callback')),
    reset: () => act(() => setString('initial')),
    condition: didClick,
    delay: 100
  })
  return (
    <div>
      <button onClick={() => setDidClick(!didClick)}>test</button>
      <div>{string}</div>
    </div>
  )
}

describe('useDelayedEffect', () => {
  it('can delay a callback', async () => {
    const { getByText } = render(<TestComponent />)

    getByText('initial')
    fireEvent.click(screen.getByText('test'))

    // Initial should not have changed to callback (yet)
    getByText('initial')

    // Wait past they delay and check again
    await new Promise(resolve => setTimeout(resolve, 200))
    getByText('callback')

    // Fire another click to reset and verify we return state immediately
    fireEvent.click(screen.getByText('test'))
    getByText('initial')
  })
})
