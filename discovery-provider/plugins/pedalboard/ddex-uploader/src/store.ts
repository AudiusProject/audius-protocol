import { DecodedUserToken } from '@audius/sdk/src/legacy'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export enum State {
    Login,
    Ingest,
    Validate,
    Upload,
    Listen
}

interface AppState {
    // application FSM
    appState: State,
    toState: (nextState: State) => void,

    // user data
    user: DecodedUserToken | null,
    setUser: (token: DecodedUserToken) => void

    // xml file data
    xmlRaw: string | null,
    setRawXml: (raw: string) => void
    xmlParsed: any | null,
    setParsedXml: (parsed: any) => void

    // validate

    // upload
}

export const appStore = create<AppState>()(devtools((set) => ({
    // initial app state is to log in the user
    appState: State.Login,
    toState: (nextState) => set((_) => ({ appState: nextState })),

    user: null,
    setUser: (token) => set((_) => ({ user: token })),

    xmlRaw: null,
    setRawXml: (raw) => set((_) => ({ xmlRaw: raw })),
    xmlParsed: null,
    setParsedXml: (parsed) => set((_) => ({ xmlParsed: parsed }))
})))
