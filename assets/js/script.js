(function ($) {
  'use strict';

  // Preloader js
  $(window).on('load', function () {
    $('.preloader').fadeOut(100);
  });

  // Sticky Menu
  $(window).scroll(function () {
    var height = $('.top-header').innerHeight();
    if ($('header').offset().top > 10) {
      $('.top-header').addClass('hide');
      $('.navigation').addClass('nav-bg');
      $('.navigation').css('margin-top','-'+height+'px');
    } else {
      $('.top-header').removeClass('hide');
      $('.navigation').removeClass('nav-bg');
      $('.navigation').css('margin-top','-'+0+'px');
    }
  });

  // Background-images
  $('[data-background]').each(function () {
    $(this).css({
      'background-image': 'url(' + $(this).data('background') + ')'
    });
  });

  //  Search Form Open
  $('#searchOpen').on('click', function () {
    $('.search-wrapper').addClass('open');
    setTimeout(function () {
      $('.search-box').focus();
    }, 500);
  });
  $('#searchClose').on('click', function () {
    $('.search-wrapper').removeClass('open');
  });

  //Hero Slider
  $('.hero-slider').slick({
    autoplay: true,
    autoplaySpeed: 6500,
    pauseOnFocus: false,
    pauseOnHover: false,
    infinite: true,
    arrows: true,
    fade: true,
    prevArrow: '<button type=\'button\' class=\'prevArrow\'><i class=\'ti-angle-left\'></i></button>',
    nextArrow: '<button type=\'button\' class=\'nextArrow\'><i class=\'ti-angle-right\'></i></button>',
    dots: true
  });
  $('.hero-slider').slickAnimation();

  // venobox popup
  $(document).ready(function () {
    $('.venobox').venobox();
  });

  // filter
  $(document).ready(function () {
    var containerEl = document.querySelector('.filtr-container');
    var filterizd;
    if (containerEl) {
      filterizd = $('.filtr-container').filterizr({});
    }
    //Active changer
    $('.filter-controls li').on('click', function () {
      $('.filter-controls li').removeClass('active');
      $(this).addClass('active');
    });
  });

  //  Count Up
  function counter() {
    var oTop;
    if ($('.count').length !== 0) {
      oTop = $('.count').offset().top - window.innerHeight;
    }
    if ($(window).scrollTop() > oTop) {
      $('.count').each(function () {
        var $this = $(this),
          countTo = $this.attr('data-count');
        $({
          countNum: $this.text()
        }).animate({
          countNum: countTo
        }, {
          duration: 1000,
          easing: 'swing',
          step: function () {
            $this.text(Math.floor(this.countNum));
          },
          complete: function () {
            $this.text(this.countNum);
          }
        });
      });
    }
  }
  $(window).on('scroll', function () {
    counter();
  });

  // Animation
  $(document).ready(function () {
    $('.has-animation').each(function (index) {
      $(this).delay($(this).data('delay')).queue(function () {
        $(this).addClass('animate-in');
      });
    });
  });

  // Blog image maximize
/*  $('.content img').on('click', function (e) {
    BigPicture({
      el: e.target,
      overlayColor: 'rgba(15,15,15,.94)',
    });
  });
*/
})(jQuery);

// initialize BiggerPicture
const bp = BiggerPicture({
  target: document.body
});

// grab image links
const imageLinks = document.querySelectorAll(".content img");

// add click listener to open BiggerPicture
for (let link of imageLinks) {
  link.addEventListener("click", openGallery);
}

// open BiggerPicture
function openGallery(e) {
  e.preventDefault();
  bp.open({
    items: imageLinks,
    el: e.currentTarget,
    maxZoom: 2
  });
}

// wowchemy search
function removeQueryParamsFromUrl() {
  if (window.history.replaceState) {
    let urlWithoutSearchParams =
      window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.hash;
    window.history.replaceState({path: urlWithoutSearchParams}, '', urlWithoutSearchParams);
  }
}

function toggleSearchDialog() {
  if ($('body').hasClass('searching')) {
    // Clear search query and hide search modal.
    $('[id=search-query]').blur();
    $('body').removeClass('searching compensate-for-scrollbar');

    // Remove search query params from URL as user has finished searching.
    removeQueryParamsFromUrl();

    // Prevent fixed positioned elements (e.g. navbar) moving due to scrollbars.
    $('#fancybox-style-noscroll').remove();
  } else {
    // Prevent fixed positioned elements (e.g. navbar) moving due to scrollbars.
    if (!$('#fancybox-style-noscroll').length && document.body.scrollHeight > window.innerHeight) {
      $('head').append(
        '<style id="fancybox-style-noscroll">.compensate-for-scrollbar{margin-right:' +
          (window.innerWidth - document.documentElement.clientWidth) +
          'px;}</style>',
      );
      $('body').addClass('compensate-for-scrollbar');
    }

    // Show search modal.
    $('body').addClass('searching');
    $('.search-results').css({opacity: 0, visibility: 'visible'}).animate({opacity: 1}, 200);
    let algoliaSearchBox = document.querySelector('.ais-SearchBox-input');
    if (algoliaSearchBox) {
      algoliaSearchBox.focus();
    } else {
      $('#search-query').focus();
    }
  }
}

$(window).on('load', function () {
  // Parse keyboard shortcuts.
  document.addEventListener('keyup', (event) => {
    if (event.code === 'Escape') {
      const body = document.body;
      if (body.classList.contains('searching')) {
        // Close search dialog.
        toggleSearchDialog();
      }
    }
    // Use `key` to check for slash. Otherwise, with `code` we need to check for modifiers.
    if (event.key === '/') {
      let focusedElement =
        (document.hasFocus() &&
          document.activeElement !== document.body &&
          document.activeElement !== document.documentElement &&
          document.activeElement) ||
        null;
      let isInputFocused = focusedElement instanceof HTMLInputElement || focusedElement instanceof HTMLTextAreaElement;
      if ( !isInputFocused) {
        // Open search dialog.
        event.preventDefault();
        toggleSearchDialog();
      }
    }
  });

  // Search event handler
  // Check that built-in search or Algolia enabled.
  if (true) {
    // On search icon click toggle search dialog.
    $('.js-search').click(function (e) {
      e.preventDefault();
      toggleSearchDialog();
    });
  }
  $('[data-toggle="tooltip"]').tooltip();
});
