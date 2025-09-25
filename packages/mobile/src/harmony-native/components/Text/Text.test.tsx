import { render, screen } from '@testing-library/react-native'

import { Text } from './Text'

test('renders text correctly', () => {
  render(<Text>hello world</Text>)

  expect(screen.getByText(/hello world/i)).toBeOnTheScreen()
})

test('it renders display variant correctly', () => {
  render(<Text variant='display'>test display</Text>)

  expect(
    screen.getByRole('heading', { name: /test display/i })
  ).toBeOnTheScreen()
})

test('it renders heading variant correctly', () => {
  render(<Text variant='heading'>test heading</Text>)

  expect(
    screen.getByRole('heading', { name: /test heading/i })
  ).toBeOnTheScreen()
})

test('it renders labels correctly', () => {
  render(<Text variant='label'>test label</Text>)

  expect(screen.getByText(/test label/i)).toHaveStyle({
    textTransform: 'uppercase'
  })
})

test('it renders color correctly', () => {
  render(<Text color='subdued'>test label</Text>)

  expect(screen.getByText(/test label/i)).toHaveStyle({
    color: '#C2C0CC'
  })
})

test('it detects subscript characters and applies adjustments', () => {
  // Test with subscript characters (₀₁₂₃₄₅₆₇₈₉)
  render(<Text>Price: $0.0₄68352</Text>)

  const textElement = screen.getByText(/Price: \$0\.0₄68352/i)

  // Should have transform property for translateY
  expect(textElement).toHaveStyle({
    transform: [{ translateY: expect.any(Number) }]
  })
})

test('it does not apply subscript adjustments for normal text', () => {
  render(<Text>Normal text without subscripts</Text>)

  const textElement = screen.getByText(/Normal text without subscripts/i)

  // Should not have transform property
  expect(textElement).not.toHaveStyle({
    transform: [{ translateY: expect.any(Number) }]
  })
})

test('it handles mixed content with and without subscripts', () => {
  render(<Text>Price: $0.0₄68352 and $1.23</Text>)

  const textElement = screen.getByText(/Price: \$0\.0₄68352 and \$1\.23/i)

  // Should still apply adjustments since subscripts are present
  expect(textElement).toHaveStyle({
    transform: [{ translateY: expect.any(Number) }]
  })
})
