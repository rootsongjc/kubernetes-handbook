#/bin/bash
echo -e "\033[0;32mDeploying updates to GitHub...\033[0m"

msg="rebuilding site `date`"
if [ $# -eq 1  ]
    then msg="$1"
fi

git add -A
git commit -m "$msg"
git push origin master

# Build the project. 
hugo # if using a theme, replace by `hugo -t <yourtheme>`
hugo-algolia

# Go To Public folder
cd public

# Add algolia search index
grep -v '"content":' algolia.json>rootsongjc-hugo.json
rm -f algolia.json

# Add changes to git.
git add -A

# Commit changes.

git commit -m "$msg"

# Push source and build repos.
git push origin master

cd ../
