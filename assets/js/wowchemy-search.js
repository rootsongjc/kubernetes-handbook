/*************************************************
 *  Wowchemy
 *  https://github.com/wowchemy/wowchemy-hugo-themes
 *
 *  In-built Fuse based search algorithm.
 **************************************************/

import {search_config, i18n, content_type} from '@params';

/* ---------------------------------------------------------------------------
 * Configuration.
 * --------------------------------------------------------------------------- */

// Configure Fuse.
let fuseOptions = {
  shouldSort: true,
  includeMatches: true,
  tokenize: true,
  threshold: search_config.threshold, // Set to ~0.3 for parsing diacritics and CJK languages.
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: search_config.minLength, // Set to 1 for parsing CJK languages.
  keys: [
    {name: 'title', weight: 0.99} /* 1.0 doesn't work o_O */,
    {name: 'summary', weight: 0.6},
    {name: 'content', weight: 0.2},
  ],
};

// Configure summary.
let summaryLength = 100;

/* ---------------------------------------------------------------------------
 * Functions.
 * --------------------------------------------------------------------------- */

// Get query from URI.
function getSearchQuery(name) {
  return decodeURIComponent((location.search.split(name + '=')[1] || '').split('&')[0]).replace(/\+/g, ' ');
}

// Set query in URI without reloading the page.
function updateURL(url) {
  if (history.replaceState) {
    window.history.replaceState({path: url}, '', url);
  }
}

// Pre-process new search query.
function initSearch(force, fuse) {
  let query = $('#search-query').val();

  // If query deleted, clear results.
  if (query.length < 1) {
    $('#search-hits').empty();
    $('#search-common-queries').show();
  }

  // Check for timer event (enter key not pressed) and query less than minimum length required.
  if (!force && query.length < fuseOptions.minMatchCharLength) return;

  // Do search.
  $('#search-hits').empty();
  $('#search-common-queries').hide();
  searchAcademic(query, fuse);
  let newURL =
    window.location.protocol +
    '//' +
    window.location.host +
    window.location.pathname +
    '?q=' +
    encodeURIComponent(query) +
    window.location.hash;
  updateURL(newURL);
}

// Perform search.
function searchAcademic(query, fuse) {
  let results = fuse.search(query);
  //console.log({"results": results});

  if (results.length > 0) {
    $('#search-hits').append('<p class="mt-0 hits-title">' + results.length + ' ' + i18n.results + '</p>');
    parseResults(query, results);
  } else {
    $('#search-hits').append('<div class="search-no-results">' + i18n.no_results + '</div>');
  }
}

// Parse search results.
function parseResults(query, results) {
  $.each(results, function (key, value) {
    let content_key = value.item.section;
    let content = '';
    let snippet = '';
    let snippetHighlights = [];

    // Show abstract in results for content types where the abstract is often the primary content.
    if (['publication', 'event'].includes(content_key)) {
      content = value.item.summary;
    } else {
      content = value.item.content;
    }

    if (fuseOptions.tokenize) {
      snippetHighlights.push(query);
    } else {
      $.each(value.matches, function (matchKey, matchValue) {
        if (matchValue.key == 'content') {
          let start = matchValue.indices[0][0] - summaryLength > 0 ? matchValue.indices[0][0] - summaryLength : 0;
          let end =
            matchValue.indices[0][1] + summaryLength < content.length
              ? matchValue.indices[0][1] + summaryLength
              : content.length;
          snippet += content.substring(start, end);
          snippetHighlights.push(
            matchValue.value.substring(
              matchValue.indices[0][0],
              matchValue.indices[0][1] - matchValue.indices[0][0] + 1,
            ),
          );
        }
      });
    }

    if (snippet.length < 1) {
      snippet += value.item.summary; // Alternative fallback: `content.substring(0, summaryLength*2);`
    }

    // Load template.
    let template = $('#search-hit-fuse-template').html();

    // Localize content types.
    if (content_key in content_type) {
      content_key = content_type[content_key];
    }

    // Parse template.
    let templateData = {
      key: key,
      title: value.item.title,
      type: content_key,
      relpermalink: value.item.relpermalink,
      snippet: snippet,
    };
    let output = render(template, templateData);
    $('#search-hits').append(output);

    // Highlight search terms in result.
    $.each(snippetHighlights, function (hlKey, hlValue) {
      $('#summary-' + key).mark(hlValue);
    });
  });
}

function render(template, data) {
  // Replace placeholders with their values.
  let key, find, re;
  for (key in data) {
    find = '\\{\\{\\s*' + key + '\\s*\\}\\}'; // Expect placeholder in the form `{{x}}`.
    re = new RegExp(find, 'g');
    template = template.replace(re, data[key]);
  }
  return template;
}

/* ---------------------------------------------------------------------------
 * Initialize.
 * --------------------------------------------------------------------------- */

// If Academic's in-built search is enabled and Fuse loaded, then initialize it.
if (typeof Fuse === 'function') {
  // Wait for Fuse to initialize.
  $.getJSON(search_config.indexURI, function (search_index) {
    let fuse = new Fuse(search_index, fuseOptions);
    // On page load, check for search query in URL.
    let query = getSearchQuery('q');
    if (query) {
      $('body').addClass('searching');
      $('.search-results').css({opacity: 0, visibility: 'visible'}).animate({opacity: 1}, 200);
      $('#search-query').val(query);
      $('#search-query').focus();
      initSearch(true, fuse);
    }

    // On search box key up, process query.
    $('#search-query').keyup(function (e) {
      clearTimeout($.data(this, 'searchTimer')); // Ensure only one timer runs!
      if (e.keyCode == 13) {
        initSearch(true, fuse);
      } else {
        $(this).data(
          'searchTimer',
          setTimeout(function () {
            initSearch(false, fuse);
          }, 250),
        );
      }
    });
  });
}
