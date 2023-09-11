export const waitForTransaction = (transactionNumber: number) => {
  cy.intercept({ method: 'POST', url: '**/relay' }).as(
    `relayCheck-${transactionNumber}`
  )
  cy.wait(`@relayCheck-${transactionNumber}`).then((xhr) => {
    const { blockHash, blockNumber } = xhr.response.body.receipt
    cy.intercept({
      url: '**/block_confirmation*',
      query: { blockhash: blockHash, blocknumber: String(blockNumber) }
    }).as(`blockConfirmation-${blockNumber}`)

    waitForBlockConfirmation(`@blockConfirmation-${blockNumber}`)
  })
}

const waitForBlockConfirmation = (routeAlias, retries = 3) => {
  cy.wait(routeAlias).then((xhr) => {
    const { block_found, block_passed } = xhr.response.body.data
    if (block_found && block_passed) {
    } else if (retries > 0) waitForBlockConfirmation(routeAlias, retries - 1)
    // wait for the next response
    else throw new Error('All requests returned non-200 response')
  })
}

export enum Genre {
  ALL = 'All Genres',
  ELECTRONIC = 'Electronic',
  ROCK = 'Rock',
  METAL = 'Metal',
  ALTERNATIVE = 'Alternative',
  HIP_HOP_RAP = 'Hip-Hop/Rap',
  EXPERIMENTAL = 'Experimental',
  PUNK = 'Punk',
  FOLK = 'Folk',
  POP = 'Pop',
  AMBIENT = 'Ambient',
  SOUNDTRACK = 'Soundtrack',
  WORLD = 'World',
  JAZZ = 'Jazz',
  ACOUSTIC = 'Acoustic',
  FUNK = 'Funk',
  R_AND_B_SOUL = 'R&B/Soul',
  DEVOTIONAL = 'Devotional',
  CLASSICAL = 'Classical',
  REGGAE = 'Reggae',
  PODCASTS = 'Podcasts',
  COUNTRY = 'Country',
  SPOKEN_WORK = 'Spoken Word',
  COMEDY = 'Comedy',
  BLUES = 'Blues',
  KIDS = 'Kids',
  AUDIOBOOKS = 'Audiobooks',
  LATIN = 'Latin',
  LOFI = 'Lo-Fi',
  HYPERPOP = 'Hyperpop',

  // Electronic Subgenres
  TECHNO = 'Techno',
  TRAP = 'Trap',
  HOUSE = 'House',
  TECH_HOUSE = 'Tech House',
  DEEP_HOUSE = 'Deep House',
  DISCO = 'Disco',
  ELECTRO = 'Electro',
  JUNGLE = 'Jungle',
  PROGRESSIVE_HOUSE = 'Progressive House',
  HARDSTYLE = 'Hardstyle',
  GLITCH_HOP = 'Glitch Hop',
  TRANCE = 'Trance',
  FUTURE_BASS = 'Future Bass',
  FUTURE_HOUSE = 'Future House',
  TROPICAL_HOUSE = 'Tropical House',
  DOWNTEMPO = 'Downtempo',
  DRUM_AND_BASS = 'Drum & Bass',
  DUBSTEP = 'Dubstep',
  JERSEY_CLUB = 'Jersey Club',
  VAPORWAVE = 'Vaporwave',
  MOOMBAHTON = 'Moombahton'
}
