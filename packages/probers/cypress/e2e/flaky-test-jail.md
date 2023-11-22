# Flaky Test Jail

![flaky test meme](./flaky%20test%20meme.jpeg)

This is where we list out misbehaving tests go if they're so we can keep a green baseline

## Current Inmates

#### [Upload Track](./uploadTrack.cy.ts)

This entire suite is in jail.

The upload flow seems to generally take too long in CI and results in timeouts and consistent failures.

#### [Sign Up](./signUp.cy.ts) - [C-3403](https://linear.app/audius/issue/C-3403/get-signup-e2e-green)

`"should create an account (mobile/desktop)"` are in jail because the new sign up flow is still a WIP and this test + the code needs more work before going green again

`"can navigate to sign-up from ...xyz (mobile/desktop)"` are in jail due to a bug 
with the sign up modal where it just shows the waves background and no content [separate bug ticket](https://linear.app/audius/issue/C-3401/sign-up-sometimes-shows-waves-and-no-content)

<!-- Template

#### [Test Name](./link-to-test-file.cy.ts) - [ticket-number](ticket-link)

Description of which tests and why they're in flaky test jail

-->

## Test Jail Process

- Create an appropriate ticket for addressing the test
- Update this doc with the flaky tests and a description
- Add a TODO: comment by the test with the ticket number
