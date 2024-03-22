import dayjs from 'dayjs'

import aiAttribution from '../fixtures/aiAttribution.json'
import remix from '../fixtures/remix.json'
const timestamp = dayjs().format('YYMMDD_HHmmss')

const visitUpload = () => {
  cy.login()
  cy.findByRole('link', { name: /upload track/i }).click()
  cy.findByRole('heading', { name: /upload your music/i, level: 1 }).should(
    'exist'
  )
}

const completeUpload = () => {
  cy.findByRole('button', { name: /complete upload/i }).click()

  cy.findByRole('dialog', { name: /confirm upload/i }).within(() => {
    cy.findByRole('button', { name: /upload/i }).click()
  })

  cy.findByRole('heading', {
    name: /uploading your/i,
    level: 1
  }).should('exist')

  cy.findByRole('main').within(() => {
    cy.findByRole('progressbar', { name: /upload in progress/i }).should(
      'have.attr',
      'aria-valuenow',
      '0'
    )

    const assertProgress = (progress: number) => {
      cy.waitUntil(
        () => {
          return cy
            .findByRole('progressbar', { name: /upload in progress/i })
            .then((progressbar) => {
              return Number(progressbar.attr('aria-valuenow')) > progress
            })
        },
        { timeout: 100000, interval: 5000 }
      )
    }

    assertProgress(0)
    assertProgress(10)
    assertProgress(20)
    assertProgress(30)
    assertProgress(40)
    assertProgress(50)
    assertProgress(60)
    assertProgress(70)
    assertProgress(80)
    assertProgress(90)
  })

  cy.findByText(/finalizing upload/i).should('exist')

  cy.findByRole('heading', {
    name: /your upload is complete/i,
    level: 3,
    timeout: 100000
  }).should('exist')
}

describe('Upload Collection', () => {
  beforeEach(() => {
    localStorage.setItem('HAS_REQUESTED_BROWSER_PUSH_PERMISSION', 'true')
  })

  it('should upload a playlist', () => {
    visitUpload()

    // Select track

    cy.findByTestId('upload-dropzone').attachFile(
      ['track-small.mp3', 'track-small-2.mp3'],
      {
        subjectType: 'drag-n-drop'
      }
    )

    cy.findByRole('radiogroup', { name: 'Release Type' }).within(() => {
      cy.findByRole('radio', { name: 'Playlist' }).click({ force: true })
    })

    cy.findByRole('button', { name: /continue uploading/i }).click()

    // Complete track form

    cy.findByRole('heading', {
      name: /complete your playlist/i,
      level: 1
    }).should('exist')
    cy.findByRole('button', { name: /add artwork/i }).click()

    cy.findByTestId('upload-dropzone').attachFile('track-artwork.jpeg', {
      subjectType: 'drag-n-drop'
    })

    cy.findByRole('textbox', { name: /Playlist Name/i })
      .clear()
      .type(`Test playlist ${timestamp}`)

    let i = 1
    cy.findAllByRole('textbox', { name: /track name/i }).each(($el) => {
      cy.wrap($el).clear().type(`Test track ${i++} ${timestamp}`)
    })

    cy.findByRole('combobox', { name: /pick a genre/i })
      .click()
      .type('pro')
    cy.findByRole('option', { name: /electronic - progressive house/i }).click()

    cy.findByRole('combobox', { name: /pick a mood/i }).click()
    cy.findByRole('option', { name: /tender/i }).click()

    cy.findByRole('textbox', { name: /tags/i })
      .type('tag1{enter}')
      .type('tag2')
      .tab()

    cy.findByRole('textbox', { name: /playlist description/i }).type(
      'Test Description'
    )

    completeUpload()

    cy.findByRole('link', { name: /visit playlist page/i }).click()
    cy.findByRole('heading', { name: /playlist/i, level: 1 }).should('exist')

    cy.findByRole('table').within(() => {
      cy.findByRole('cell', { name: /Test track 1/ })
      cy.findByRole('cell', { name: /Test track 2/ })
    })
  })

  it('should upload a album', () => {
    visitUpload()

    // Select track

    cy.findByTestId('upload-dropzone').attachFile(
      ['track-small.mp3', 'track-small-2.mp3'],
      {
        subjectType: 'drag-n-drop'
      }
    )

    cy.findByRole('radiogroup', { name: 'Release Type' }).within(() => {
      cy.findByRole('radio', { name: 'Album' }).click({ force: true })
    })

    cy.findByRole('button', { name: /continue uploading/i }).click()

    // Complete track form

    cy.findByRole('heading', {
      name: /complete your album/i,
      level: 1
    }).should('exist')
    cy.findByRole('button', { name: /add artwork/i }).click()

    cy.findByTestId('upload-dropzone').attachFile('track-artwork.jpeg', {
      subjectType: 'drag-n-drop'
    })

    cy.findByRole('textbox', { name: /Album Name/i })
      .clear()
      .type(`Test album ${timestamp}`)

    let i = 1
    cy.findAllByRole('textbox', { name: /track name/i }).each(($el) => {
      cy.wrap($el).clear().type(`Test track ${i++} ${timestamp}`)
    })

    cy.findByRole('combobox', { name: /pick a genre/i })
      .click()
      .type('pro')
    cy.findByRole('option', { name: /electronic - progressive house/i }).click()

    cy.findByRole('combobox', { name: /pick a mood/i }).click()
    cy.findByRole('option', { name: /tender/i }).click()

    cy.findByRole('textbox', { name: /tags/i })
      .type('tag1{enter}')
      .type('tag2')
      .tab()

    cy.findByRole('textbox', { name: /album description/i }).type(
      'Test Description'
    )

    completeUpload()

    cy.findByRole('link', { name: /visit album page/i }).click()
    cy.findByRole('heading', { name: /album/i, level: 1 }).should('exist')

    cy.findByRole('table').within(() => {
      cy.findByRole('cell', { name: /Test track 1/ })
      cy.findByRole('cell', { name: /Test track 2/ })
    })
  })
})
