const setIsCreatorToTrue = async (libs) => {
  console.error('Sanity Check - setIsCreatorToTrue')
  const user = libs.userStateManager.getCurrentUser()

  if (!user) return

  if (!user.is_creator) {
    const newMetadata = { ...user, is_creator: true }

    await libs.User.updateCreator(user.user_id, newMetadata)
  }
}

module.exports = setIsCreatorToTrue
