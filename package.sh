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
RANGE=("DEVNET" "TESTNET" "MAINNET" "MAINNETTEST" "MAINNET")
check_in_range $TARGET "${RANGE[@]}"

target=$(tr '[:upper:]' '[:lower:]' <<<$TARGET) #convert to lowercase

check_argument_set_default "$2" "all" "target architecture to build for"
TARGET_ARCH=$RETURN_VALUE

RANGE=("all" "linux" "mac" "windows")
check_in_range $TARGET_ARCH "${RANGE[@]}"


NODE_PATH="/var/tmp/neuralium"
if test ! -d $NODE_PATH; then
  echo "Error: This script expects that $NODE_PATH exists, have you run neuralium/Neuralium/src/scripts/deployment/publish-all.sh ?"
  exit 1
fi

check_argument_set_default "$3" "git" "check git status, use e.g. 'nogit' to disable git check"
GIT_ARG=$RETURN_VALUE

#################### end of arguments parsing ########################
REAL_TARGET=$TARGET
if [ "$TARGET" = "MAINNETTEST" ]; then 
    TARGET="MAINNET"
    target="mainnet"
fi

### git status check:
if [ "$GIT_ARG" = "git" ]; then
    echo "WARNING: STASHING GIT CHANGES (if any), we need a clean slate"
    git stash
    #git checkout $TARGET #too restrictive, turns out it is more convenient to just set the git repos at the branch you want and run the scripts
    git pull --ff-only #will fetch and merge

    if [ -n "$(git status --untracked-files=no --porcelain)" ]; then 
        echo "git status not clean, aborting..."
        echo $(git status --untracked-files=no --porcelain)
        exit 1
    fi
fi


### build optimizations:
cp angular.json angular.json.bck
cp package.json package.json.bck
cleanup() {
    mv angular.json.bck angular.json
    mv package.json.bck package.json
    exit $1
}

if [[ "$REAL_TARGET" != "MAINNETTEST" ]]; then 
    sed -i -e s/"\"aot\": false"/"\"aot\": true"/g -e s/"\"buildOptimizer\": false"/"\"buildOptimizer\": true"/g  angular.json
    sed -i -e s/"\"sourceMap\": true"/"\"sourceMap\": false"/g angular.json
    sed -i -e s/"\"optimization\": false"/"\"optimization\": true"/g angular.json
else
    echo "Target is $REAL_TARGET, removing angular optimizations"
    sed -i -e s/"\"aot\": true"/"\"aot\": false"/g -e s/"\"buildOptimizer\": true"/"\"buildOptimizer\": false"/g  angular.json
    sed -i -e s/"\"sourceMap\": false"/"\"sourceMap\": true"/g angular.json
    sed -i -e s/"\"optimization\": true"/"\"optimization\": false"/g angular.json
fi

cat angular.json | grep -E -- "net\": {|aot|buildOptimizer|sourceMap|optimization"


### Build and packaging:
rm -rf ./release
mkdir -p release/logs
npm install > release/logs/npm-install-log.txt
npm audit fix > release/logs/npm-audit-log.txt

echo "(ALWAYS) packaging linux for target $target ($TARGET)..."
if npm run electron:linux:$target > release/logs/npm-run-package-linux.txt; then
    ARCHIVE_NAME="neuralium.wallet-linux-$REAL_TARGET.tar.gz"
    
    echo "packaging linux completed, compressing to $ARCHIVE_NAME"
    tar -zcvf ./release/$ARCHIVE_NAME ./release/linux-unpacked > release/logs/$ARCHIVE_NAME.txt
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
    echo "packaging $ARCHITECTURE for target $target ($TARGET)..."
    if npm run package:$ARCHITECTURE > release/logs/npm-run-package-$ARCHITECTURE.txt; then

        ARCHIVE_NAME="neuralium.wallet-$ARCHITECTURE-$REAL_TARGET.zip"
        echo "packaging $ARCHITECTURE completed, compressing to file $ARCHIVE_NAME"
        if [ "$ARCHITECTURE" = mac ]; then
            zip -r ./release/$ARCHIVE_NAME ./release/mac > release/logs/$ARCHIVE_NAME.txt
        elif [ "$ARCHITECTURE" = windows ]; then
	   zip -r ./release/$ARCHIVE_NAME ./release/win-unpacked > release/logs/$ARCHIVE_NAME.txt
        fi
    else
        echo "$ARCHITECTURE packaging failed"
        cleanup 1
    fi
done


cleanup 0
