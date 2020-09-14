# mad-dog
🐶 Creator Node Test Suite

## Usage
### Standing Up/Down Services:
- npm run start up/down

### Running Tests
- npm run start test

## Notes
- `service-commands` need to be linked, or the latest version published to npm.

## Code Structure
- The single test in mad-dog is based on the class `EmitterBasedTest`. This class
sets up a test that uses emitters to fire off events representing requests to our services, and then fires events for handling those responess. The test implementer is responsible for fleshing out listeners for emitted events. **To see an example of this, look at `tests/test_1.js`**

- `executeOne`? `executeAll`? These are just two helper functions that make it easier to perform libs operations in a test. `executeAll` performs some operation on every initted instance of libs in parallel, while `executeOne` takes in index and performs the operation against that instance of libs. Both functions accept a function that is passed an instance of libs:
```
const trackId = await executeOne(walletIndex, libs =>
  uploadTrack(libs, track, TRACK_DIR)
)
```
