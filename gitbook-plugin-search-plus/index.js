var Entities = require('html-entities').AllHtmlEntities

var Html = new Entities()

// Map of Lunr ref to document
var documentsStore = { }

module.exports = {
  book: {
    assets: './assets',
    js: [
      'jquery.mark.min.js',
      'search.js'
    ],
    css: [
      'search.css'
    ]
  },

  hooks: {
    // Index each page
    'page': function (page) {
      if (this.output.name !== 'website' || page.search === false) {
        return page
      }

      var text

      this.log.debug.ln('index page', page.path)

      text = page.content
      // Decode HTML
      text = Html.decode(text)
      // Strip HTML tags
      text = text.replace(/(<([^>]+)>)/ig, '')
      text = text.replace(/[\n ]+/g, ' ')
      var keywords = []
      if (page.search) {
        keywords = page.search.keywords || []
      }

      // Add to index
      var doc = {
        url: this.output.toURL(page.path),
        title: page.title,
        summary: page.description,
        keywords: keywords.join(' '),
        body: text
      }

      documentsStore[doc.url] = doc

      return page
    },

    // Write index to disk
    'finish': function () {
      if (this.output.name !== 'website') return

      this.log.debug.ln('write search index')
      return this.output.writeFile('search_plus_index.json', JSON.stringify(documentsStore))
    }
  }
}
