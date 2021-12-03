export type SignOnStackParamList = {
  SignOn: undefined
  CreatePassword: { email: string }
  ProfileAuto: { email: string; password: string }
  ProfileManual: {
    email: string
    password: string
    name?: string
    handle?: string
    twitterId?: string
    twitterScreenName?: string
    instagramId?: string
    instagramScreenName?: string
    verified?: boolean
    profilePictureUrl?: string
    coverPhotoUrl?: string
  }
  FirstFollows: { email: string; handle: string }
  SignupLoadingPage: undefined
}
