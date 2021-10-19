This directory houses everything that will eventually be pulled out of `@audius/client` into a separate package.

As features get migrated to RN relevant code should be added here. Eventually everything will be pulled into
@audius/client-common and the mobile client will no longer be dependent on the web client.

NOTE: Nothing in this directory should not depend on anything in `@audius/client`. All dependencies need to be colocated.
