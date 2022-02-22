require(['gitbook', 'jQuery'], function (gitbook, $) {
  var url = ''
  var style = ''
  var insertLogo = function (url, style) {
    $('.book-summary').children().eq(0).before('<div class="book-logo"><img src="' + url + '" style="' + style + '"></div>')
  }
  gitbook.events.bind('start', function (e, config) {
    url = config['insert-logo']['url']
    style = config['insert-logo']['style']
  })

  gitbook.events.bind("page.change", function() {
    insertLogo(url, style)
  })
})
