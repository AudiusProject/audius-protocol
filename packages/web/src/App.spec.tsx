import { test, expect } from '@playwright/experimental-ct-react'
const App = () => <div>HEllo World</div>
test.use({ viewport: { width: 500, height: 500 } })

test('should work', async ({ mount }) => {
  const component = await mount(<App />)
  await expect(component).toContainText('Hello World')
})
