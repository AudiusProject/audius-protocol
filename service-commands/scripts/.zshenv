ZDOTDIR=$HOME

declare -A ZINIT
ZINIT[HOME_DIR]=$HOME/.zinit
ZINIT[BIN_DIR]=${ZINIT[HOME_DIR]}/bin

export LC_CTYPE=C
export LANG=C

export EDITOR=vi
export VISUAL=code

export GOPRIVATE="github.com/AudiusProject"
export LOGNAME=ubuntu

export PROTOCOL_DIR=$HOME/repos/audius-protocol

typeset -U PATH path
path=(
    "$HOME/bin"
    "$HOME/.local/bin"
    "$HOME/go/bin"
    "/usr/local/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/bin/"
    "$HOME/.local/share/solana/install/active_release/bin"
    "$path[@]"
)

export PATH

export HOMEBREW_NO_INSTALL_CLEANUP=1
