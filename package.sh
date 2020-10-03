#!/bin/bash

#imports:
. ./bash-tools/utils.sh 1
if (( $? != 0)); then
    echo "Could not import utils.sh, you're in the wrong directory"
    exit 1
fi

check_expected_path "$0" "neuralium-wallet"

check_argument_set_default "$1" "TESTNET" "neuralium network tag"
TARGET=$RETURN_VALUE
target=$(tr '[:upper:]' '[:lower:]' <<<$TARGET) #convert to lowercase

check_argument_set_default "$2" "all" "target architecture to build for"
TARGET_ARCH=$RETURN_VALUE

RANGE=("all" "linux" "mac" "windows")
check_in_range $TARGET_ARCH $RANGE


NODE_PATH="/var/tmp/neuralium"
if test ! -d $NODE_PATH; then
  echo "Error: This script expects that $NODE_PATH exists, have you run neuralium/Neuralium/src/scripts/deployment/publish-all.sh ?"
  exit 1
fi

check_argument_set_default "$3" "git" "check git status"
GIT_ARG=$RETURN_VALUE

if [ "$GIT_ARG" = "git" ]; then
    git checkout $TARGET
    git pull --ff-only #will fetch and merge

    if [ -n "$(git status --untracked-files=no --porcelain)" ]; then 
        echo "git status not clean, aborting..."
        echo $(git status --untracked-files=no --porcelain)
        exit 1
    fi
fi

cp angular.json angular.json.bck
cleanup() {
    mv angular.json.bck angular.json
    exit $1
}

sed -i -e s/"\"aot\": false"/"\"aot\": true"/g -e s/"\"buildOptimizer\": false"/"\"buildOptimizer\": true"/g  angular.json
sed -i -e s/"\"sourceMap\": true"/"\"sourceMap\": false"/g angular.json
sed -i -e s/"\"optimization\": false"/"\"optimization\": true"/g angular.json

cat angular.json | grep -E -- "net\": {|aot|buildOptimizer|sourceMap|optimization"

rm -rf ./release
mkdir -p release/logs
npm install > release/logs/npm-install-log.txt
npm audit fix > release/logs/npm-audit-log.txt

echo "(ALWAYS) packaging linux for target $target..."
if npm run electron:linux:$target > release/logs/npm-run-package-linux.txt; then
        
    echo "packaging linux completed"
else
    echo "linux packaging failed"
    cleanup 1
fi


if [ "$TARGET_ARCH" = "all" ]; then
    ARCHITECTURES=(mac windows)
elif [ "$TARGET_ARCH" = "linux" ]; then
    echo "$TARGET_ARCH already built"
    ARCHITECTURES=()
else
    ARCHITECTURES=($TARGET_ARCH)
fi

for ARCHITECTURE in "${ARCHITECTURES[@]}"
do
    echo "packaging $ARCHITECTURE for target $target..."
    if npm run package:$ARCHITECTURE > release/logs/npm-run-package-$ARCHITECTURE.txt; then
            
        echo "packaging $ARCHITECTURE  completed"
        if [ "$ARCHITECTURE" = mac ]; then
            zip -r ./release/neuralium.wallet-macos.zip ./release/mac
        fi
    else
        echo "$ARCHITECTURE packaging failed"
        cleanup 1
    fi
done


cleanup 0
