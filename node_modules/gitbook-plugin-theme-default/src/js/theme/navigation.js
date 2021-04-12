var $ = require('jquery');
var url = require('url');

var loading = require('./loading');
var platform = require('./platform');

var gitbook = window.gitbook;

var usePushState = (typeof history.pushState !== 'undefined');

/*
    Get current scroller element
*/
function getScroller() {
    if (platform.isSmallScreen()) {
        return $('.book-body');
    } else {
        return $('.body-inner');
    }
}

/*
    Scroll to a specific hash tag in the content
*/
function scrollToHash(hash) {
    var $scroller = getScroller(),
        dest = 0;

    // Don't try to scroll if element doesn't exist
    if (!pageHasElement(hash)) {
        return;
    }

    if (hash) {
        dest = getElementTopPosition(hash);
    }

    // Unbind scroll detection
    $scroller.unbind('scroll');
    $scroller.animate({
        scrollTop: dest
    }, 800, 'swing', function() {
        // Reset scroll binding when finished
        $scroller.scroll(handleScrolling);
    });

    // Directly set chapter as active
    setChapterActive(null, hash);
}

/*
    Return wether the element exists on the page
 */
function pageHasElement(id) {
    var $scroller  = getScroller(),
        $el        = $scroller.find(id);

    return !!$el.length;
}

/*
    Utility functions
*/

// Checks if a jQuery element is empty
function isEmpty(element) {
    return element.length === 0;
}

// Any returns true if the predicate is true on any of the elements in the list
function any(arr, predicate) {
    return arr.length > 0 && arr.filter(predicate).length > 0;

}

/*
    Return the top position of an element
 */
function getElementTopPosition(id) {
    // Get actual position of element if nested
    var $scroller  = getScroller(),
        $container = $scroller.find('.page-inner'),
        $el        = $scroller.find(id),
        $parent    = $el.offsetParent(),
        dest       = 0;

    // Exit early if we can't find any of those elements
    if (any([$scroller, $container, $el, $parent], isEmpty)) {
        return 0;
    }

    dest = $el.position().top;

    // Note: this could be a while loop, but to avoid any chances of infinite loops
    // we'll limit the max iterations to 10
    var MAX_ITERATIONS = 10;
    for (var i = 0; i < MAX_ITERATIONS; i++) {
        // Stop when we find the element's ancestor just below $container
        // or if we hit the top of the dom (parent's parent is itself)
        if ($parent.is($container) || $parent.is($parent.offsetParent())) {
            break;
        }

        // Go up the DOM tree, to the next parent
        $el = $parent;
        dest += $el.position().top;
        $parent = $el.offsetParent();
    }

    // Return rounded value since
    // jQuery scrollTop() returns an integer
    return Math.floor(dest);
}


/*
    Handle updating summary at scrolling
*/
var $chapters,
    $activeChapter;

// Set a chapter as active in summary and update state
function setChapterActive($chapter, hash) {
    // No chapter and no hash means first chapter
    if (!$chapter && !hash) {
        $chapter = $chapters.first();
    }

    // If hash is provided, set as active chapter
    if (!!hash) {
        // Multiple chapters for this file
        if ($chapters.length > 1) {
            $chapter = $chapters.filter(function() {
                var titleId = getChapterHash($(this));
                return titleId == hash;
            }).first();
        }
        // Only one chapter, no need to search
        else {
            $chapter = $chapters.first();
        }
    }

    // Don't update current chapter
    if ($chapter.is($activeChapter)) {
        return;
    }

    // Update current active chapter
    $activeChapter = $chapter;

    // Add class to selected chapter
    $chapters.removeClass('active');
    $chapter.addClass('active');

    // Update history state if needed
    hash = getChapterHash($chapter);

    var oldUri = window.location.pathname + window.location.hash,
        uri = window.location.pathname + hash;

    if (uri != oldUri) {
        history.replaceState({ path: uri }, null, uri);
    }
}

// Return the hash of link for a chapter
function getChapterHash($chapter) {
    var $link = $chapter.children('a'),
        hash = $link.attr('href').split('#')[1];

    if (hash) hash = '#'+hash;
    return (!!hash)? hash : '';
}

// Handle user scrolling
function handleScrolling() {
    // Get current page scroll
    var $scroller      = getScroller(),
        scrollTop      = $scroller.scrollTop(),
        scrollHeight   = $scroller.prop('scrollHeight'),
        clientHeight   = $scroller.prop('clientHeight'),
        nbChapters     = $chapters.length,
        $chapter       = null;

    // Find each title position in reverse order
    $($chapters.get().reverse()).each(function(index) {
        var titleId = getChapterHash($(this)),
            titleTop;

        if (!!titleId && !$chapter) {
            titleTop = getElementTopPosition(titleId);

            // Set current chapter as active if scroller passed it
            if (scrollTop >= titleTop) {
                $chapter = $(this);
            }
        }
        // If no active chapter when reaching first chapter, set it as active
        if (index == (nbChapters - 1) && !$chapter) {
            $chapter = $(this);
        }
    });

    // ScrollTop is at 0, set first chapter anyway
    if (!$chapter && !scrollTop) {
        $chapter = $chapters.first();
    }

    // Set last chapter as active if scrolled to bottom of page
    if (!!scrollTop && (scrollHeight - scrollTop == clientHeight)) {
        $chapter = $chapters.last();
    }

    setChapterActive($chapter);
}

/*
    Handle a change of url withotu refresh the whole page
*/
var prevUri = location.href;
function handleNavigation(relativeUrl, push) {
    var prevUriParsed = url.parse(prevUri);

    var uri = url.resolve(window.location.pathname, relativeUrl);
    var uriParsed = url.parse(uri);
    var hash = uriParsed.hash;

    // Is it the same url (just hash changed?)
    var pathHasChanged = (uriParsed.pathname !== prevUriParsed.pathname);

    // Is it an absolute url
    var isAbsolute = Boolean(uriParsed.hostname);

    if (!usePushState || isAbsolute) {
        // Refresh the page to the new URL if pushState not supported
        location.href = relativeUrl;
        return;
    }

    // Don't fetch same page
    if (!pathHasChanged) {
        if (push) history.pushState({ path: uri }, null, uri);
        return scrollToHash(hash);
    }

    prevUri = uri;

    var promise = $.Deferred(function(deferred) {
        $.ajax({
            type: 'GET',
            url: uri,
            cache: true,
            headers:{
                'Access-Control-Expose-Headers': 'X-Current-Location'
            },
            success: function(html, status, xhr) {
                // For GitBook.com, we handle redirection signaled by the server
                var responseURL = xhr.getResponseHeader('X-Current-Location') || uri;

                // Replace html content
                html = html.replace( /<(\/?)(html|head|body)([^>]*)>/ig, function(a,b,c,d){
                    return '<' + b + 'div' + ( b ? '' : ' data-element="' + c + '"' ) + d + '>';
                });

                var $page = $(html),
                    $pageBody = $page.find('.book'),
                    $pageHead;

                // We only use history.pushState for pages generated with GitBook
                if ($pageBody.length === 0) {
                    var err = new Error('Invalid gitbook page, redirecting...');
                    return deferred.reject(err);
                }

                // Push url to history
                if (push) {
                    history.pushState({
                        path: responseURL
                    }, null, responseURL);
                }

                // Force reparsing HTML to prevent wrong URLs in Safari
                $page = $(html);
                $pageHead = $page.find('[data-element=head]');
                $pageBody = $page.find('.book');

                // Merge heads
                // !! Warning !!: we only update necessary portions to avoid strange behavior (page flickering etc ...)

                // Update title
                document.title = $pageHead.find('title').text();

                // Reference to $('head');
                var $head = $('head');

                // Update next & prev <link> tags
                // Remove old
                $head.find('link[rel=prev]').remove();
                $head.find('link[rel=next]').remove();

                // Add new next * prev <link> tags
                $head.append($pageHead.find('link[rel=prev]'));
                $head.append($pageHead.find('link[rel=next]'));

                // Merge body
                var bodyClass = $('.book').attr('class');
                var scrollPosition = $('.book-summary').scrollTop();

                $pageBody.toggleClass('with-summary', $('.book').hasClass('with-summary'));

                $('.book').replaceWith($pageBody);
                $('.book').attr('class', bodyClass);
                $('.book-summary').scrollTop(scrollPosition);

                // Update state
                gitbook.state.$book = $('.book');
                preparePage(!hash);

                // Scroll to hashtag position
                if (hash) {
                    scrollToHash(hash);
                }

                deferred.resolve();
            }
        });
    }).promise();

    return loading.show(
        promise
        .fail(function (e) {
            console.log(e); // eslint-disable-line no-console
            // location.href = relativeUrl;
        })
    );
}

function updateNavigationPosition() {
    var bodyInnerWidth, pageWrapperWidth;

    bodyInnerWidth = parseInt($('.body-inner').css('width'), 10);
    pageWrapperWidth = parseInt($('.page-wrapper').css('width'), 10);
    $('.navigation-next').css('margin-right', (bodyInnerWidth - pageWrapperWidth) + 'px');

    // Reset scroll to get current scroller
    var $scroller = getScroller();
    // Unbind existing scroll event
    $scroller.unbind('scroll');
    $scroller.scroll(handleScrolling);
}

function preparePage(resetScroll) {
    var $bookBody = $('.book-body');
    var $bookInner = $bookBody.find('.body-inner');
    var $pageWrapper = $bookInner.find('.page-wrapper');

    // Update navigation position
    updateNavigationPosition();

    // Focus on content
    $pageWrapper.focus();

    // Get scroller
    var $scroller = getScroller();

    // Reset scroll
    if (resetScroll !== false) {
        $scroller.scrollTop(0);
    }

    // Get current page summary chapters
    $chapters = $('.book-summary .summary .chapter')
    .filter(function() {
        var $link = $(this).children('a'),
            href  = null;

        // Chapter doesn't have a link
        if (!$link.length) {
            return false;
        }
        else {
            href = $link.attr('href').split('#')[0];
        }

        var resolvedRef = url.resolve(window.location.pathname, href);
        return window.location.pathname == resolvedRef;
    });

    // Bind scrolling if summary contains more than one link to this page
    if ($chapters.length > 1) {
        $scroller.scroll(handleScrolling);
    }
    // Else, set only chapter in summary as active
    else {
        $activeChapter = $chapters.first();
    }
}

function isLeftClickEvent(e) {
    return e.button === 0;
}

function isModifiedEvent(e) {
    return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}

/*
    Handle click on a link
*/
function handleLinkClick(e) {
    var $this = $(this);
    var target = $this.attr('target');

    if (isModifiedEvent(e) || !isLeftClickEvent(e) || target) {
        return;
    }

    e.stopPropagation();
    e.preventDefault();

    var url = $this.attr('href');
    if (url) handleNavigation(url, true);
}

function goNext() {
    var url = $('.navigation-next').attr('href');
    if (url) handleNavigation(url, true);
}

function goPrev() {
    var url = $('.navigation-prev').attr('href');
    if (url) handleNavigation(url, true);
}


function init() {
    // Prevent cache so that using the back button works
    // See: http://stackoverflow.com/a/15805399/983070
    $.ajaxSetup({
        cache: false
    });

    // Recreate first page when the page loads.
    history.replaceState({ path: window.location.href }, '');

    // Back Button Hijacking :(
    window.onpopstate = function (event) {
        if (event.state === null) {
            return;
        }

        return handleNavigation(event.state.path, false);
    };

    $(document).on('click', '.navigation-prev', handleLinkClick);
    $(document).on('click', '.navigation-next', handleLinkClick);
    $(document).on('click', '.summary [data-path] a', handleLinkClick);
    $(document).on('click', '.page-inner a', handleLinkClick);

    $(window).resize(updateNavigationPosition);

    // Prepare current page
    preparePage(false);
}

module.exports = {
    init: init,
    goNext: goNext,
    goPrev: goPrev
};
