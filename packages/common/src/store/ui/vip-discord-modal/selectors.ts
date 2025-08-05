import { CommonState } from '../../commonStore'

export const getDiscordCode = (state: CommonState) =>
  state.ui.vipDiscordModal.discordCode
