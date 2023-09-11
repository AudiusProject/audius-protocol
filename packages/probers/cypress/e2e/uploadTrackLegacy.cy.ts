import user from '../fixtures/user.json'

describe('Upload Track', () => {
  beforeEach(() => {
    localStorage.setItem('HAS_REQUESTED_BROWSER_PUSH_PERMISSION', 'true')
    localStorage.setItem(
      'FeatureFlagOverride:upload_redesign_enabled',
      'disabled'
    )
  })
  it('should upload a track', () => {
    const base64Entropy = Buffer.from(user.entropy).toString('base64')
    cy.visit(`trending?login=${base64Entropy}`)
    cy.findByText(user.name, { timeout: 20000 }).should('exist')

    cy.findByRole('link', { name: /upload track/i }).click()

    cy.findByRole('heading', { name: /upload tracks/i, level: 1 }).should(
      'exist'
    )

    cy.findByTestId('upload-dropzone').attachFile('track.mp3', {
      subjectType: 'drag-n-drop'
    })

    cy.findByRole('button', { name: /continue/i }).click()

    cy.findByRole('combobox', { name: /pick a genre/i }).click()
    cy.findByRole('option', { name: /rock/i }).click()

    // Add track artwork
    cy.findByRole('button', { name: /change artwork/i }).click()

    cy.findByTestId('upload-dropzone').attachFile('track-artwork.jpeg', {
      subjectType: 'drag-n-drop'
    })

    cy.findByRole('button', { name: /close popup/ })

    cy.findByRole('button', { name: /continue/i }).click()

    cy.findByRole('main').within(() => {
      cy.findByRole('progressbar').should('have.attr', 'aria-valuenow', '0')

      cy.waitUntil(() => {
        return cy.findByRole('progressbar').then((progressbar) => {
          return Number(progressbar.attr('aria-valuenow')) > 0
        })
      })

      cy.waitUntil(() => {
        return cy.findByRole('progressbar').then((progressbar) => {
          return Number(progressbar.attr('aria-valuenow')) > 50
        })
      })

      cy.waitUntil(
        () => {
          return cy.findByRole('progressbar').then((progressbar) => {
            return Number(progressbar.attr('aria-valuenow')) === 100
          })
        },
        { timeout: 10000 }
      )
    })

    cy.findByText(/processing.../i).should('exist')

    cy.findByRole('heading', {
      name: /upload complete/i,
      level: 1,
      timeout: 40000
    }).should('exist')

    cy.findByRole('button', { name: /view track page/i }).click()

    cy.findByRole('heading', { name: /track/i, level: 1 }).should('exist')
  })

  it('should upload a track with a subgenre', () => {
    const base64Entropy = Buffer.from(user.entropy).toString('base64')
    cy.visit(`trending?login=${base64Entropy}`)
    cy.findByText(user.name, { timeout: 20000 }).should('exist')

    cy.findByRole('link', { name: /upload track/i }).click()

    cy.findByRole('heading', { name: /upload tracks/i, level: 1 }).should(
      'exist'
    )

    cy.findByTestId('upload-dropzone').attachFile('track.mp3', {
      subjectType: 'drag-n-drop'
    })

    cy.findByRole('button', { name: /continue/i }).click()

    cy.findByRole('combobox', { name: /pick a genre/i }).click()
    cy.get('.rc-virtual-list-holder').scrollTo('bottom', {
      ensureScrollable: false
    })
    cy.findByRole('option', { name: /electronic - dubstep/i }).click()

    // Add track artwork
    cy.findByRole('button', { name: /change artwork/i }).click()

    cy.findByTestId('upload-dropzone').attachFile('track-artwork.jpeg', {
      subjectType: 'drag-n-drop'
    })

    cy.findByRole('button', { name: /close popup/ })

    cy.findByRole('button', { name: /continue/i }).click()

    cy.findByRole('main').within(() => {
      cy.findByRole('progressbar').should('have.attr', 'aria-valuenow', '0')

      cy.waitUntil(() => {
        return cy.findByRole('progressbar').then((progressbar) => {
          return Number(progressbar.attr('aria-valuenow')) > 0
        })
      })

      cy.waitUntil(() => {
        return cy.findByRole('progressbar').then((progressbar) => {
          return Number(progressbar.attr('aria-valuenow')) > 50
        })
      })

      cy.waitUntil(
        () => {
          return cy.findByRole('progressbar').then((progressbar) => {
            return Number(progressbar.attr('aria-valuenow')) === 100
          })
        },
        { timeout: 10000 }
      )
    })

    cy.findByText(/processing.../i).should('exist')

    cy.findByRole('heading', {
      name: /upload complete/i,
      level: 1,
      timeout: 40000
    }).should('exist')

    cy.findByRole('button', { name: /view track page/i }).click()

    cy.findByRole('heading', { name: /track/i, level: 1 }).should('exist')
  })
})
