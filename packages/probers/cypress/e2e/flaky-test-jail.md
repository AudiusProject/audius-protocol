# Flaky Test Jail

![flaky test meme](./flaky%20test%20meme.jpeg)

A list of flaky/misbehaving tests that we are currently skipping in order to keep a green baseline

## Current Inmates 

#### [Upload Track](./uploadTrack.cy.ts) - [C-3508]

This entire suite is in jail.

The upload flow seems to generally take too long in CI and results in timeouts and consistent failures.


#### [Sign In](./signIn.cy.ts) - [C-4005]

The 'can sign in' test is in jail until we can hard-code an OTP code



<!-- Template

#### [Test Name](./link-to-test-file.cy.ts) - [ticket-number](ticket-link)

Description of which tests and why they're in flaky test jail

-->

## Test Jail Process

- Create an appropriate ticket for addressing the test
- Update this doc with the flaky tests and a description
- Add a TODO: comment by the test with the ticket number for searchability
