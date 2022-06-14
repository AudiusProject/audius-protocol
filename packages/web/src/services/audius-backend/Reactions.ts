import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'

const libs = () => window.audiusLibs

export const submitReaction = async ({
  reactedTo,
  reactionValue
}: {
  reactedTo: string
  reactionValue: number
}): Promise<{ success: boolean; error: any }> => {
  try {
    await waitForLibsInit()
    return libs().Reactions.submitReaction({ reactedTo, reactionValue })
  } catch (err) {
    const errorMessage = (err as any).message
    console.error(errorMessage)
    return { success: false, error: errorMessage }
  }
}
