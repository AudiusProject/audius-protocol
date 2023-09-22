describe('Example', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  it('should open the sign up screen', async () => {
    await expect(element(by.text(/sign into audius/i))).toBeVisible()
  })
})
