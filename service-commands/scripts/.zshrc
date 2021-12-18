# Environment Variables {{{
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000

# ZLE_RPROMPT_INDENT=0
ZSH_DISABLE_COMPFIX=true

declare -A ZINIT
ZINIT[HOME_DIR]=$HOME/.zinit
ZINIT[BIN_DIR]=${ZINIT[HOME_DIR]}/bin
# }}}

# zsh Options {{{
setopt autocd
setopt beep
setopt extendedglob
setopt hist_ignore_all_dups
setopt interactivecomments
setopt nomatch
setopt notify

bindkey -e
# }}}

# Setup zdharma/zinit {{{
if [[ ! -f ${ZINIT[BIN_DIR]}/zinit.zsh ]]; then
   print -P "%F{220}Installing Plugin Manager (zdharma/zinit)...%f"
   mkdir -m g-rwX -p "${ZINIT[HOME_DIR]}"
   git clone https://github.com/zdharma-continuum/zinit "${ZINIT[BIN_DIR]}" && \
     print -P "%F{34}Installation successful.%f%b" || \
     print -P "%F{160}The clone has failed.%f%b"
fi

source "${ZINIT[BIN_DIR]}/zinit.zsh"
autoload -Uz _zinit
(( ${+_comps} )) && _comps[zinit]=_zinit
# }}}

# Powerlevel10k Instant Prompt {{{
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi
# }}}

# Load Plugins {{{
zinit ice depth=1

zinit light romkatv/powerlevel10k
zinit light zsh-users/zsh-autosuggestions
zinit light zsh-users/zsh-completions
zinit light zsh-users/zsh-syntax-highlighting
zinit light lukechilds/zsh-nvm

[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
# }}}

# Plugin Config {{{
ZSH_HIGHLIGHT_HIGHLIGHTERS=(main brackets)
# }}}

# Setup completion {{{
zstyle ':completion:*' completer _expand _complete _ignored _prefix
zstyle ':completion:*' expand prefix
zstyle ':completion:*' insert-unambiguous true
zstyle ':completion:*' list-colors ''
zstyle ':completion:*' list-suffixes true

autoload -Uz compinit
compinit -u

zinit cdreplay
# }}}

# Aliases {{{

## Modified commands
alias diff='colordiff'              # requires colordiff package
alias grep='grep --color=auto'
alias df='df -h'
alias du='du -c -h'
alias mkdir='mkdir -p -v'
alias nano='nano -w'
alias ping='ping -c 5'
alias dmesg='dmesg -HL'

## New commands
alias da='date "+%A, %B %d, %Y [%T]"'
alias du1='du --max-depth=1'
alias hist='history | grep'         # requires an argument
alias openports='ss --all --numeric --processes --ipv4 --ipv6'
alias pgg='ps -Af | grep'           # requires an argument
alias ..='cd ..'

# Privileged access
if (( UID != 0 )); then
    alias sudo='sudo '
    alias scat='sudo cat'
    alias svim='sudoedit'
    alias root='sudo -i'
    alias reboot='sudo systemctl reboot'
    alias poweroff='sudo systemctl poweroff'
    alias netctl='sudo netctl'
fi

## ls
alias ls='ls -hF'
alias lr='ls -R'                    # recursive ls
alias ll='ls -l'
alias la='ll -A'
alias lx='ll -BX'                   # sort by extension
alias lz='ll -rS'                   # sort by size
alias lt='ll -rt'                   # sort by date
alias lm='la | more'

## Safety features
alias cls=' echo -ne "\033c"'       # clear screen for real (it does not work in Terminology)

## User aliases
alias history='history 1'
alias vi='nvim'
alias top='htop'
alias python='python3'
alias pip='python -m pip'
alias gssh='gcloud compute ssh'

## docker aliases
alias docker-prune="docker rm $(docker ps --all -q -f status=dead); docker network prune; ocker system prune"
alias docker-port-nuke-linux="sudo systemctl stop docker; sudo rm -rf /var/lib/docker/containers/*; sudo systemctl start docker"

if [[ $(uname) = "Darwin" ]]; then
    alias gcc='gcc-11'
    alias g++='g++-11'
    alias firefox='open -a Firefox'
    alias chrome='open -a Google\ Chrome'
fi

# }}}
