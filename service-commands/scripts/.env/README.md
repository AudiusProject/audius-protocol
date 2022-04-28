# Audius Env Migration Manager

This directory houses a dotfiles manager that assists with migrations from one
remote-dev box to another.

The manager should be installed locally (on your MBP) and remotely
(on your current remote-dev box) before its potential can be truly unlocked.

This manager utilizes symlinks and git as a way to consolidate your dotfiles
and track changes, respectively.

## Goals

* Ease environmental pain when migrating between remote-dev boxes.
* Assist in standardizing your favorite aliases/envar settings.
* Easily track changes to some of your favorite dotfiles, as seen in [these examples](#add-your-own-files-local-andor-old-box).
* Easily revert back to a "vanilla" state when attempting to debug setup issues.

## Non-Goals

* Centralization of Audius-centric opinionated dotfiles.
* Assist in migration of anything other than dotfiles:
  * Docker Images (Docker images should be rebuilt)
  * Code (Git branches should be used)
  * Caches (Caches should be recreated)

**NOTE:** While customization of your local dev environment is encouraged
and can lead to boosts in productivity, over-customization that follows
from environment to environment can lead to issues always being seen in
only your environment. Be cautious of your customizations.

## Env Manager

### Add/Track New Dotfile

```
~/bin/.env.add ~/.yourdotfile
```

### Sync Dotfiles Across Machines

Git is used to keep your environments in sync.

```
git push
git pull
```

### Install All Tracked Dotfiles

```
~/bin/.env.install
```

## Migration Manager

Run your personalized migration:

```
~/bin/migrate ${OLD_BOX} ${NEW_BOX}
```

## Setup

### Enable Aliases

Add this to your `~/.profile`, if missing:

```
echo '
if [ -d ~/.aliases ]; then
  for f in ~/.aliases/*; do
    source $f
  done
fi' >> $HOME/.profile
```

### Install Env Manager Locally (on your MBP)

```
cp -r . ~/.env
rm ~/.env/.gitignore
~/.env/bin/.env.install
```

### Track Personal Changes

```
cd ~/.env
git init
git commit -am "first commit"
```

Set up a personal [GitHub repo](https://github.com/new), then:

```
GIT_URL=git@github.com:username/.env

git remote add origin ${GIT_URL}
git push -u origin master
```

### Install on Old Box

```
GIT_URL=git@github.com:username/.env

git clone ${GIT_URL} ~/.env
```

### Add Your Own Files (Local and/or Old Box)

Some examples:

```
./bin/.env.add ~/.bashrc
./bin/.env.add ~/.config/i3/config
./bin/.env.add ~/.config/iterm2/com.googlecode.iterm2.plist
./bin/.env.add ~/.config/terminator/config
./bin/.env.add ~/.gitconfig
./bin/.env.add ~/.gitignore
./bin/.env.add ~/.p10k.zsh
./bin/.env.add ~/.profile
./bin/.env.add ~/.screenlayout
./bin/.env.add ~/.shenv
./bin/.env.add ~/.sift.conf
./bin/.env.add ~/.skhdrc
./bin/.env.add ~/.vimrc
./bin/.env.add ~/.xscreensaver
./bin/.env.add ~/.yabairc
./bin/.env.add ~/.zshenv
./bin/.env.add ~/.zshrc
./bin/.env.add /etc/ssh/sshd_config.d/10-default.conf

./bin/.env.install

git commit
git push
```

### Setup Keyless SSH Access

Migration requires keyless SSH access to remote dev boxes and github.com,
for example:

```
Host *
  ForwardAgent yes
  
Host github.com
  IdentityFile ~/.ssh/id_ed25519.github

Host box*
  IdentityFile ~/.ssh/google_compute_engine
  IdentityFile ~/.ssh/audius_infrastructure
  IdentityFile ~/.ssh/id_ed25519.github
  User ubuntu
  Port 22
  ForwardAgent yes
  RequestTTY force

Host box
  HostName 104.198.141.182
  # LocalForward 3000 127.0.0.1:3000

Host box-old
  HostName 34.135.105.13
```

### Personalize your Migration

Perform the migration:

```
vi ~/bin/migrate
# update GIT_URL
# update logic/flow
```

## Additional Optional Settings

~/.gitconfig:

```
[color]
  ui = auto
[core]
  excludesFile = ~/.gitignore
[include]
  path = ~/.gituser
[init]
  defaultBranch = main
[diff]
  colorMoved = zebra
[url "git@github.com:"]
  insteadOf = https://github.com/
```

~/.gituser:

```
[user]
  email = youremail@email.com
  name = Your Name
```
