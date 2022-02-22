// script to style blockquotes for info, warning, success and danger

styleMap = {
    '[info]': {
        htmlStr: '<i class="fa fa-info-circle"></i>',
        className: 'info',
    },
    '[warning]': {
        htmlStr: '<i class="fa fa-exclamation-circle"></i>',
        className: 'warning'
    },
    '[danger]': {
        htmlStr: '<i class="fa fa-ban"></i>',
        className: 'danger'
    },
    '[success]': {
        htmlStr: '<i class="fa fa-check-circle"></i>',
        className: 'success'
    }
}

require(["gitbook", "jQuery"], function(gitbook, $) {
    // Load
    gitbook.events.bind("page.change", function(e, config) {
        bqs = $('blockquote');
        bqs.each(function(index) {

            for (key in styleMap) {
                htmlStr = $(this).html()

                if (htmlStr.indexOf(key) > 0) {
                    // remove key from text
                    var style = styleMap[key];
    
                    htmlStr = htmlStr.replace(key, style.htmlStr);
                    $(this).html(htmlStr);

                    // set style
                    $(this).addClass(style.className)
                }
            }

        })
    });
});
