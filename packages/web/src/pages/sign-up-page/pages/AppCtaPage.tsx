import AppCTA from 'pages/sign-on/components/desktop/AppCTA'

export type AppCtaState = {
  stage: 'app-cta'
}

export const AppCtaPage = () => {
  return <AppCTA onNextPage={() => {}} />
}
