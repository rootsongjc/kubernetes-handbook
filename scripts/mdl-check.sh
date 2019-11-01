#!/bin/bash

FAILED=0

echo -ne "mdl "
mdl --version

# This performs markdown style check over changed markdown files
check_pull_request_content() {
    
    # only check pull request, skip others
    if [[ -z $CIRCLE_PULL_REQUEST ]]; then
        echo "Skip, only check pull request."
        exit 0
    fi
    
    # get changed files of this PR
    CIRCLE_PR_NUMBER=${CIRCLE_PULL_REQUEST##*/}
    OWNER=$(echo $CIRCLE_PULL_REQUEST | cut -d / -f 4)
    REPO=$(echo $CIRCLE_PULL_REQUEST | cut -d / -f 5)
    URL="https://api.github.com/repos/$OWNER/$REPO/pulls/$CIRCLE_PR_NUMBER/files"
    
    echo
    echo "Getting list of changed markdown files..."
    CHANGED_MARKDOWN_FILES=()
    while IFS=$'\n' read -r line; do
        CHANGED_MARKDOWN_FILES+=( "${line}" )
    done < <(curl --retry 20 -s -X GET -G $URL | jq '.[] | select(.status != "removed") | select(.filename | endswith(".md")) | .filename')
    echo "Total changed markdown files: ${#CHANGED_MARKDOWN_FILES[@]}"
    echo "${CHANGED_MARKDOWN_FILES[@]}"
    echo
    
    if [[ "${#CHANGED_MARKDOWN_FILES[@]}" != "0" ]]; then
        echo "${CHANGED_MARKDOWN_FILES[@]}" | xargs mdl --ignore-front-matter --style mdl_style.rb
        if [[ "$?" != "0" ]]; then
            FAILED=1
        fi
    else
        echo "No changed markdown files to check."
    fi
}

check_pull_request_content

if [[ $FAILED -eq 1 ]]; then
    echo "MARKDOWN STYLE CHECK FAILED"
    exit 1
else
    echo "MARKDOWN STYLE CHECK SUCCEEDED"
fi
