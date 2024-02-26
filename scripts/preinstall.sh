set -e

should_error=false

if ! [ -z $CI ]; then
  exit 0
fi

export NVM_DIR=$HOME/.nvm;
source $NVM_DIR/nvm.sh;

nvm install
pyenv install -s
rbenv install -s

required_node_version=$(<.nvmrc)
current_node_version=$(node --version)

if [ $current_node_version != $required_node_version ]; then
  echo "Invalid node version. Expected $required_node_version, got $current_node_version"
  should_error=true
fi

required_ruby_version=$(<'.ruby-version')
current_ruby_version=$(ruby --version)

if [[ ! $current_ruby_version =~ $required_ruby_version ]]; then
  echo "Invalid ruby version. Expected $required_ruby_version, got $current_ruby_version"
  should_error=true
fi

required_python_version=$(<'.python-version')
current_python_version=$(python --version)

if [[ ! $current_python_version =~ $required_python_version ]]; then
  echo "Invalid python version. Expected $required_python_version, got $current_python_version"
  should_error=true
fi

if [[ $should_error = true ]]; then
  exit 1
fi
