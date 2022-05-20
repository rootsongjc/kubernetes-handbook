#!/bin/bash
docker run -it --env APPLICATION_ID=CRNDR5CNMU --env API_KEY=${API_KEY} --env "CONFIG=$(cat algolia-config.json | jq -r tostring)" algolia/docsearch-scraper
