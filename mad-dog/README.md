# mad-dog
🐶 End-to-End Protocol Test Suite

## Usage
### Setup/Installation -- Linking Local Packages:
1. Make sure your services are up (`A run init-repos up && A up`). Mad dog runs against local services to provide e2e test coverage.
2. cd to `/libs` and run `npm i && npm run build && npm link`
3. cd to `/service-commands` and run `npm i && npm link && npm link @audius/libs`
4. cd to `/mad-dog` and run `npm i && npm link @audius/libs @audius/service-commands`
5. Install Pumba (chaos testing tool for Docker -- some but not all tests use it):
    1. `sudo curl -L https://github.com/alexei-led/pumba/releases/download/0.7.8/pumba_linux_amd64 --output /usr/local/bin/pumba`
    2. `sudo chmod +x /usr/local/bin/pumba`

### Running Tests
**Run all the tests in test suite**: 
- `npm run start <test name>`

**Run all the tests in test suite with specified account offset**: 
- `npm run start <test name> <0-99 offset of wallets in config.json>`

**Run all the tests in test suite in verbose mode (prints out container logs if tests fail)**: 
- `npm run start <test name> verbose` 
- `npm run start <test name> <0-99 offset of wallets in config.json> verbose` 

## Notes
- `service-commands` need to be linked, or the latest version published to npm.
- In the event that mad-dog fails due to libs errors, try running `npm i` in `/libs` and relinking packages.
- If mad-dog fails for other random reasons, it could be a state issue -- try bringing up a fresh set of services.

## Code Structure
- The single test in mad-dog is based on the class `EmitterBasedTest`. This class
sets up a test that uses emitters to fire off events representing requests to our services, and then fires events for handling those responess. The test implementer is responsible for fleshing out listeners for emitted events. **To see an example of this, look at `tests/test_integration.js`**

- If you want to run tests without the emitter system, look at `tests/test_ipldBlacklist.js`

- `executeOne`? `executeAll`? These are just two helper functions that make it easier to perform libs operations in a test. `executeAll` performs some operation on every initted instance of libs in parallel (we init a new libs instance for each wallet), while `executeOne` takes in index and performs the operation against that instance of libs. Both functions accept a function that is passed an instance of libs:
```
const trackId = await executeOne(walletIndex, libs =>
  uploadTrack(libs, track, TRACK_DIR)
)
```
