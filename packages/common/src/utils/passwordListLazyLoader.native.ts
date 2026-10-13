// React Native has no code splitting, so the 172 KB offline list would ship in
// every bundle and OTA update. Native relies on the Have I Been Pwned check in
// commonPasswordCheck and skips the offline fallback.
export const commonPasswordList = {
  test: (_password: string) => false
}
