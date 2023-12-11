export const createEmailPageMessages = {
  title: 'Sign Up For Audius',
  emailLabel: 'Email',
  signUp: 'Sign Up Free',
  haveAccount: 'Already have an account?',
  signIn: 'Sign In',
  subHeader: {
    // Two separate lines separated by a divider. Can't include the divider here since its different for native vs web
    line1: 'Join the revolution in music streaming!',
    line2: 'Discover, connect, and create on Audius.'
  },
  socialsDividerText: 'Or, get started with one of your socials',
  unknownError: 'Unknown error occurred.',
  metaMaskNotRecommended: 'Signing up with MetaMask is not recommended.',
  signUpMetamask: 'Sign Up With MetaMask',
  learnMore: 'Learn More'
}

export type CompletionChecklistType =
  | 'hasNumber'
  | 'minLength'
  | 'notCommon'
  | 'matches'

export const createPasswordPageMessages = {
  createYourPassword: 'Create Your Password',
  description:
    'Create a password that’s secure and easy to remember! We can’t reset your password, so write it down or use a password manager.',
  yourEmail: 'Your Email',
  passwordLabel: 'Password',
  confirmPasswordLabel: 'Confirm Password',
  completionChecklist: {
    hasNumber: 'Must contain numbers',
    minLength: 'At least 8 characters',
    matches: 'Passwords match',
    notCommon: 'Hard to guess'
  }
}

export const finishProfilePageMessages = {
  header: 'Finish Your Profile',
  description:
    'Your photos & display name is how others see you. Customize with special character, spaces, emojis, whatever!',
  displayName: 'Display Name',
  inputPlaceholder: 'express yourself 💫',
  goBack: 'Go back'
}
