#!/usr/bin/env node

import { program } from 'commander'

import './create-playlist.mjs'
import './edit-playlist.mjs'
import './create-user.mjs'
import './edit-user.mjs'
import './favorite-track.mjs'
import './unfavorite-track.mjs'
import './favorite-playlist.mjs'
import './unfavorite-playlist.mjs'
import './follow.mjs'
import './unfollow.mjs'
import './repost-track.mjs'
import './unrepost-track.mjs'
import './repost-playlist.mjs'
import './unrepost-playlist.mjs'
import './upload-track.mjs'
import './edit-track.mjs'
import './mint-tokens.mjs'
import './tip-audio.mjs'
import './auth-headers.mjs'
import './get-audio-balance.mjs'
import './create-user-bank.mjs'
import './purchase-track.mjs'
import './route-tokens-to-user-bank.mjs'
import './withdraw-tokens.mjs'

async function main() {
  program.parseAsync(process.argv)
}

main()
