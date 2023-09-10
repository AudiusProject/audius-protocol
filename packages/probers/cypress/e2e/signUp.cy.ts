import dayjs from 'dayjs'

function generateTestUser() {
  const ts = dayjs().format('YYMMDD_HHmmss')
  const email = `prober+${ts}@audius.co`
  const password = 'Pa$$w0rdTest'
  const name = `Prober ${ts}`
  const handle = `p_${ts}`
  return {
    email,
    password,
    name,
    handle
  }
}

// Note: we have to force-click through much of this flow due to a bug with
// overflow: hidden defined in the app root. We should look into whether
// it can be removed.
describe('Sign Up', () => {
  beforeEach(() => {
    localStorage.setItem('HAS_REQUESTED_BROWSER_PUSH_PERMISSION', 'true')
  })

  it('should create a new account', () => {
    const testUser = generateTestUser()
    cy.visit('signup')
    cy.findByLabelText(/email/i).type(testUser.email)
    cy.findByRole('button', { name: /continue/i }).click()

    cy.findByRole('heading', {
      name: /create a password/i,
      level: 2,
      timeout: 10000
    }).should('exist')
    cy.findByLabelText(/^password/i).type(testUser.password)
    cy.findByLabelText(/confirm password/i).type(testUser.password)
    cy.findByRole('button', { name: /continue/i }).click({ force: true })

    cy.findByRole('heading', {
      name: /quickly complete your account by linking your other socials/i,
      level: 2
    }).should('exist')

    cy.findByRole('button', {
      name: /i'd rather fill out my profile manually/i,
      timeout: 8000
    }).click({ force: true })

    cy.findByTestId('upload-photo-dropzone').attachFile('ray_stack_Trace.png', {
      subjectType: 'drag-n-drop'
    })
    cy.findByRole('button', { name: /change/i }).should('exist')

    cy.findByLabelText(/display name/i).type(testUser.name)
    cy.findByLabelText(/handle/i).type(testUser.handle)

    // have to explicitly wait for not disabled, since force click doesn't
    // wait properly
    cy.waitUntil(() =>
      cy.findByRole('button', { name: /continue/i }).should('not.be.disabled')
    )

    cy.findByRole('button', { name: /continue/i }).click({ force: true })

    cy.findByRole('heading', {
      name: /Follow At Least 3 Artists To Get Started/,
      level: 2
    })

    cy.findByRole('list', { name: /profile selection/i })
      .findAllByRole('listitem')
      .each((profileCard, index) => {
        if (index < 5) {
          cy.wrap(profileCard).click()
        }
      })
    cy.findByRole('button', { name: /continue/i }).click({ force: true })

    cy.findByRole('heading', { name: /get the app/i, level: 2 }).should('exist')
    cy.findByRole('button', { name: /continue/i }).click()

    cy.findByRole('heading', {
      name: /Your account is almost ready to rock/i,
      level: 2
    }).should('exist')

    cy.findByRole('heading', {
      name: /it's time to start your audius journey/i,
      level: 2,
      timeout: 300000
    }).should('exist')

    cy.findByRole('button', { name: /start listening/i }).click()

    cy.findByRole('heading', { name: /your feed/i, level: 1 }).should('exist')

    cy.visit(testUser.handle)
    cy.findByRole('heading', { name: testUser.name, level: 1 }).should('exist')
  })
})
