const setIsCreatorToTrue = async (libs) => {
  const user = libs.userStateManager.getCurrentUser()

  if (!user) return

  if (!user.is_creator) {
    console.log('Setting is_creator to true')
    const newMetadata = { ...user, is_creator: true }

    await libs.User.updateCreator(user.user_id, newMetadata)
  }
}

module.exports = setIsCreatorToTrue
