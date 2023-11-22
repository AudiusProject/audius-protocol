# Flaky Test Jail

![flaky test meme](./flaky%20test%20meme.jpeg)

This is where we list out misbehaving tests go if they're so we can keep a green baseline

## Current Inmates

#### [Upload Track](./uploadTrack.cy.ts)

This entire suite is in jail at the moment.

The upload flow seems to generally take too long in CI and results in timeouts and consistent failures.

#### [Sign Up](./signUp.cy.ts)

* "should create an account" is currently in jail because the new sign up flow is still a WIP and needs more work before going green again

<!-- Template

#### [{Test Name}](./{link-to-test-file}) 

Description/justification for why it's flaky and not a real failure

-->