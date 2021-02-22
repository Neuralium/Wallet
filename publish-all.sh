#!/bin/bash

#imports:
. ./bash-tools/utils.sh 1
if (( $? != 0)); then
    echo "Could not import utils.sh, you're in the wrong directory"
    exit 1
fi

check_expected_path "$0" "neuralium-wallet"

### Arg1 : neuralium tag (e.g. MAINNET):
check_argument_set_default "$1" "TESTNET" "neuralium network tag"
NEURALIUM_TAG=$RETURN_VALUE
RANGE=("DEVNET" "TESTNET" "MAINNET" "MAINNETTEST" "MAINNET")
check_in_range $NEURALIUM_TAG "${RANGE[@]}"

neuralium_tag=$(tr '[:upper:]' '[:lower:]' <<<$NEURALIUM_TAG) #convert to lowercase

### Arg 2 target architecture/os:
check_argument_set_default "$2" "all" "neuralium_tag architecture to build for"
TARGET_ARCH=$RETURN_VALUE

RANGE=("all" "linux" "mac" "windows" "linwin")
check_in_range $TARGET_ARCH "${RANGE[@]}"


NODE_PATH="/var/tmp/Neuralium"
if test ! -d $NODE_PATH; then
  echo "Error: This script expects that $NODE_PATH exists, have you run neuralium/Neuralium/src/scripts/deployment/publish-all.sh ?"
  exit 1
fi

### Arg 3 enable/disable git status check and pull:
check_argument_set_default "$3" "git" "check git status, use e.g. 'nogit' to disable git check"
GIT_ARG=$RETURN_VALUE

### Arg 4 version number
check_argument_set_default "$4" "empty version string" "node version number (4 digits)"
VERSION_NUMBER=$RETURN_VALUE

if ! $(grep -E -q '[0-9]+.[0-9]+.[0-9]+.[0-9]+' <<<$VERSION_NUMBER); then
    echo "${RED} Wrong version format, 0.1.2.3 expected, got $VERSION_NUMBER${RESET}"
    exit 1
fi


### Arg 5 version number
DEFAULT_WALLET_VERSION_NUMBER=$(awk -F. '{print $1 "." $2 "." $3 "0" $4}' <<<$VERSION_NUMBER)
check_argument_set_default "$5" $DEFAULT_WALLET_VERSION_NUMBER "wallet version number (3 digits)"
WALLET_VERSION_NUMBER=$RETURN_VALUE

if ! $(grep -E -q '[0-9]+.[0-9]+.[0-9]+' <<<$WALLET_VERSION_NUMBER); then
    echo "${RED} Wrong version format, 0.1.2 expected, got $WALLET_VERSION_NUMBER${RESET}"
    exit 1
fi
#################### end of arguments parsing ########################

### git status check:
if [ "$GIT_ARG" = "git" ]; then
    echo "WARNING: STASHING GIT CHANGES (if any), we need a clean slate"
    git stash
    #git checkout $NEURALIUM_TAG #too restrictive, turns out it is more convenient to just set the git repos at the branch you want and run the scripts
    git pull --ff-only #will fetch and merge

    if [ -n "$(git status --untracked-files=no --porcelain)" ]; then
        echo "git status not clean, aborting..."
        echo $(git status --untracked-files=no --porcelain)
        exit 1
    fi
fi


### Build and packaging:
rm -rf ./release
mkdir -p release/logs
npm install > release/logs/npm-install-log.txt
npm audit fix > release/logs/npm-audit-log.txt

if [[ "$NEURALIUM_TAG" != "MAINNET" ]] || npm version $WALLET_VERSION_NUMBER --allow-same-version --no-git-tag-version; then
    if [[ "$NEURALIUM_TAG" == "MAINNET" ]]; then
        echo "All builds version number has been set to $VERSION_NUMBER for MAINNET"
    fi

    NPM_LOG="release/logs/npm-run-package-linux.txt"
    echo "(ALWAYS) packaging linux for neuralium_tag $neuralium_tag ($NEURALIUM_TAG (you can follow progress with 'tail - f $NPM_LOG')..."
    if npm run electron:linux:$neuralium_tag > $NPM_LOG;  then
        ARCHIVE_NAME="neuralium.wallet-linux-x64-$NEURALIUM_TAG-$VERSION_NUMBER.tar.gz"
        cp ../tooling/UserGuides/*.pdf ./release/linux-unpacked
        mv ./release/linux-unpacked ./release/neuralium-wallet

        echo "packaging linux completed, compressing to $ARCHIVE_NAME"
        tar -zcvf $NODE_PATH/builds/$ARCHIVE_NAME ./release/neuralium-wallet > release/logs/$ARCHIVE_NAME.txt
        mv ./release/neuralium-wallet ./release/linux-unpacked
    else
        cat $NPM_LOG
        echo "linux packaging failed, see $NPM_LOG"
        echo "(hint) try 'rm -rf node_modules/' them 'npm install', then 'npm start'."
        echo "The 'npm start' command will fail if you don't have a display server, but it will generate essential files."
        echo "Then retry to run this script ($0). It might solve some issues appearing after a fresh clone"
    fi


    if [ "$TARGET_ARCH" = "all" ]; then
        ARCHITECTURES=(windows) #removing mac for now
    elif [ "$TARGET_ARCH" = "linux" ]; then
        echo "$TARGET_ARCH already built"
        ARCHITECTURES=()
    elif [ "$TARGET_ARCH" = "linwin" ]; then
        ARCHITECTURES=(windows)
    else
        ARCHITECTURES=($TARGET_ARCH)
    fi

    for ARCHITECTURE in "${ARCHITECTURES[@]}"
    do
        NPM_LOG="release/logs/npm-run-package-$ARCHITECTURE.txt"
        echo "packaging $ARCHITECTURE for neuralium_tag $neuralium_tag ($NEURALIUM_TAG) (you can follow progress with 'tail - f $NPM_LOG')..."
        if npm run package:$ARCHITECTURE > $NPM_LOG; then

        ARCHIVE_NAME="neuralium.wallet-$ARCHITECTURE-$NEURALIUM_TAG-$VERSION_NUMBER.zip"
        echo "packaging $ARCHITECTURE completed, compressing to file $ARCHIVE_NAME"
        if [ "$ARCHITECTURE" = "mac" ]; then
            rm -r ./release/mac
            rm -r ./release/mas/*.app
            mkdir ./release/neuralium-wallet
            mv ./release/neuralium-wallet*.dmg ./release/neuralium-wallet
            cp ../tooling/UserGuides/*.pdf ./release/neuralium-wallet
            zip -r $NODE_PATH/builds/$ARCHIVE_NAME ./release/neuralium-wallet > release/logs/$ARCHIVE_NAME.txt
            mv ./release/neuralium-wallet ./release/mac
            cp ./release/mas/*.pkg "./release/neuralium.wallet-MAS-$ARCHITECTURE-$NEURALIUM_TAG-$VERSION_NUMBER.pkg"
            mv ./release/neuralium-wallet*.dmg.blockmap ./release/mac
        elif [ "$ARCHITECTURE" = "windows" ]; then
            cp ../tooling/UserGuides/*.pdf ./release/win-unpacked
            mv ./release/win-unpacked ./release/neuralium-wallet
            zip -r $NODE_PATH/builds/$ARCHIVE_NAME ./release/neuralium-wallet > release/logs/$ARCHIVE_NAME.txt
            mv ./release/neuralium-wallet ./release/win-unpacked
        fi
    else
        cat $NPM_LOG
        echo "$ARCHITECTURE packaging failed, see $NPM_LOG"
    fi
    done
else
  echo "Failed to set builds version number. Stopping task."
fi
