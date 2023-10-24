import { render, screen } from '@testing-library/react-native'

import { Text } from './Text'

test('renders text', () => {
  render(<Text>hello world</Text>)

  expect(screen.getByText(/hello world/i)).toBeOnTheScreen()
})
