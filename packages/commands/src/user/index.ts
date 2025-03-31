import { Command } from '@commander-js/extra-typings'
import { createUserCommand } from './create-user'
import { editUserCommand } from './edit-user'
import { followUserCommand } from './follow-user'
import { tipUserCommand } from './tip-user'
import { unfollowUserCommand } from './unfollow-user'
import { getUserCommand } from './get-user'

export const userCommand = new Command('user')
  .description('Commands that create or target a specific user')
  .addCommand(createUserCommand)
  .addCommand(editUserCommand)
  .addCommand(followUserCommand)
  .addCommand(getUserCommand)
  .addCommand(tipUserCommand)
  .addCommand(unfollowUserCommand)
