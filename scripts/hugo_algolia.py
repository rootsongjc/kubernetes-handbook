#!/usr/bin/env python
# -*- coding: utf-8 -*-

from algoliasearch import algoliasearch
import json
import os
import sys

def get_admin_key():
    if sys.argv[-1].startswith('ALGOLIA_API_KEY'):
        ADMIN_API_KEY = sys.argv[-1].split('=')[1].strip()
    else:
        ADMIN_API_KEY = os.environ.get('ALGOLIA_API_KEY')
    if not ADMIN_API_KEY:
        raise Exception("ALGOLIA_API_KEY lacked")
    return ADMIN_API_KEY

# fill them
APPLICATION_ID = 'X4YB3WOBNV'
SEARCH_ONLY_API_KEY = 'd2134c5a8d250e6d3246594240c45201'
INDEX_NAME = 'rootsongjc-hugo'

ADMIN_API_KEY = get_admin_key()

def client_for_search_only():
    return algoliasearch.Client(APPLICATION_ID, SEARCH_ONLY_API_KEY)

def client_for_admin():
    return algoliasearch.Client(APPLICATION_ID, ADMIN_API_KEY)

def get_all_objectID(index_name):
    client = client_for_admin()
    index = client.init_index(index_name)
    res = list(index.browse_all(params={'attributesToRetrieve': 'objectID'}))
    all_objectID = [row.get('objectID') for row in res]
    return all_objectID

def update_index_of_mysite():
    # your json filename
    filename = 'public/algolia.json'
    rows = json.load(open(filename))
    print('update algolia index')

    client = client_for_admin()
    index = client.init_index(INDEX_NAME)

    rows_ids = [row['objectID'] for row in rows]
    all_ids = get_all_objectID(INDEX_NAME)

    ids_to_delete = list(set(all_ids) - set(rows_ids))
    index.delete_objects(ids_to_delete)
    index.save_objects(rows)

    index.set_settings({"searchableAttributes": ["title"]})
    index.set_settings({'attributesToHighlight': ["title"]})
    index.set_settings({'attributesToSnippet': ['title']})
    # for highlight
    index.set_settings({'highlightPreTag': '<em class="ais-Highlight">', 'highlightPostTag': '</em>'})
    return {'delete': len(ids_to_delete), 'save': len(rows)}

def main():
    res = update_index_of_mysite()
    print(res)


if __name__ == '__main__':
    main()

# pip install algoliasearch
# python hugo_algolia.py ALGOLIA_API_KEY="ADMIN_API_KEY"

# https://jeremyyin.com
# jeremyyin2012@gmail.com
