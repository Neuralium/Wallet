#!/bin/bash
# This file may have been automatically copied, but belongs in neuralium/Neuralium/src/scripts/bash-tools
RETURN_VALUE=""

RED=`tput setaf 1`
GREEN=`tput setaf 2`
YELLOW=`tput setaf 3`
RESET=`tput sgr0`


LOG_LEVEL=$1

_log() {
    if (( $LOG_LEVEL != 0 )); then
        echo -e "${FUNCNAME[1]}: ${YELLOW}$1${RESET}"
    fi
}

_init() {
    RETURN_VALUE=""
}

check_argument_set_default() {
    _init
    ARG=$1 #the argument
    RETURN_VALUE=$2 #default value
    NAME=$3 #the argument description
    if [ -z "$ARG" ]; then
        _log "No argument supplied for '$NAME', using default"
    else
        RETURN_VALUE=$ARG
    fi

    _log "${GREEN}$NAME${RESET}: ${YELLOW}$RETURN_VALUE${RESET}"
}

check_mandatory_argument() {
    _init
    ARG=$1 #the argument
    NAME=$2 #the argument description
    if [ -z "$ARG" ]; then
        _log "No argument supplied for mandatory argument '$NAME', aborting"
        exit 1;
    else
        RETURN_VALUE=$ARG
    fi

    _log "${GREEN}$NAME${RESET}: ${YELLOW}$RETURN_VALUE${RESET}"
}

check_in_range() {
    _init
    ARG=$1 #the argument
    RANGE=$2 #the range
    _log ": argument '$ARG' in range '${RANGE[*]}'?..."
    
    if [ -z "$ARG" ] || [[ ! " ${RANGE[@]} " =~ " ${ARG} " ]]; then
        echo "${RED}Error${RESET}: argument '$ARG' not in range '${RANGE[*]}', aborting..."
        exit 1;
    fi
}

check_error() {
    _init
    _log "$1"
    eval $1
    if (( $? != 0 )); then
        echo "${RED}Error${RESET}: command $1 failed, aborting..."
        exit 1
    fi
}

check_expected_path() {
    _init
    SCRIPT_PATH=$(realpath $(dirname "$1")) #pass $0 as first argument
    EXPECTED_PAH=$2
    _log "matching ${YELLOW}$EXPECTED_PAH${RESET} in both \n file path: ${YELLOW}$SCRIPT_PATH${RESET} and \n working dir: ${YELLOW}$PWD${RESET}"
    if [[ $SCRIPT_PATH != *$EXPECTED_PAH* ]] && $PWD; then #check that the script is ran from the right directory, and that it is locate in the right directory
      echo "${RED}Error${RESET}: This script expects to be ran from /[...]/$EXPECTED_PAH"
      exit 1
    fi
}


trim_comments_whitespaces() {
    TRIMMED=$(sed  -e 's/#.*$//' -e '/^$/d' -e 's/^[[:blank:]]*//;s/[[:blank:]]*$//' <<<$1)
    echo "$TRIMMED"
}