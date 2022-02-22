var $ = require('jquery');

var gitbook = window.gitbook;

// List of created buttons
var buttons = [],
// Generated Id for buttons
    BTN_ID = 0;

function generateId() {
    return 'btn-'+(BTN_ID++);
}

// Insert a jquery element at a specific position
function insertAt(parent, selector, index, element) {
    var lastIndex = parent.children(selector).length;
    if (index < 0) {
        index = Math.max(0, lastIndex + 1 + index);
    }
    parent.append(element);

    if (index < lastIndex) {
        parent.children(selector).eq(index).before(parent.children(selector).last());
    }
}

// Default click handler
function defaultOnClick(e) {
    e.preventDefault();
}

// Create a dropdown menu
function createDropdownMenu(dropdown) {
    var $menu = $('<div>', {
        'class': 'dropdown-menu',
        'html': '<div class="dropdown-caret"><span class="caret-outer"></span><span class="caret-inner"></span></div>'
    });

    if (typeof dropdown == 'string') {
        $menu.append(dropdown);
    } else {
        var groups = dropdown.map(function(group) {
            if ($.isArray(group)) return group;
            else return [group];
        });

        // Create buttons groups
        groups.forEach(function(group) {
            var $group = $('<div>', {
                'class': 'buttons'
            });
            var sizeClass = 'size-'+group.length;

            // Append buttons
            group.forEach(function(btn) {
                btn = $.extend({
                    text: '',
                    className: '',
                    onClick: defaultOnClick
                }, btn || {});

                var $btn = $('<button>', {
                    'class': 'button '+sizeClass+' '+btn.className,
                    'text': btn.text
                });
                $btn.click(btn.onClick);

                $group.append($btn);
            });


            $menu.append($group);
        });

    }


    return $menu;
}

// Create a new button in the toolbar
function createButton(opts) {
    opts = $.extend({
        // Aria label for the button
        label: '',

        // Icon to show
        icon: '',

        // Inner text
        text: '',

        // Right or left position
        position: 'left',

        // Other class name to add to the button
        className: '',

        // Triggered when user click on the button
        onClick: defaultOnClick,

        // Button is a dropdown
        dropdown: null,

        // Position in the toolbar
        index: null,

        // Button id for removal
        id: generateId()
    }, opts || {});

    buttons.push(opts);
    updateButton(opts);

    return opts.id;
}

// Update a button
function updateButton(opts) {
    var $result;
    var $toolbar = $('.book-header');
    var $title = $toolbar.find('h1');

    // Build class name
    var positionClass = 'pull-'+opts.position;

    // Create button
    var $btn = $('<a>', {
        'class': 'btn',
        'text': opts.text? ' ' + opts.text : '',
        'aria-label': opts.label,
        'href': '#'
    });

    // Bind click
    $btn.click(opts.onClick);

    // Prepend icon
    if (opts.icon) {
        $('<i>', {
            'class': opts.icon
        }).prependTo($btn);
    }

    // Prepare dropdown
    if (opts.dropdown) {
        var $container = $('<div>', {
            'class': 'dropdown '+positionClass+' '+opts.className
        });

        // Add button to container
        $btn.addClass('toggle-dropdown');
        $container.append($btn);

        // Create inner menu
        var $menu = createDropdownMenu(opts.dropdown);

        // Menu position
        $menu.addClass('dropdown-'+(opts.position == 'right'? 'left' : 'right'));

        $container.append($menu);
        $result = $container;
    } else {
        $btn.addClass(positionClass);
        $btn.addClass(opts.className);
        $result = $btn;
    }

    $result.addClass('js-toolbar-action');

    if ($.isNumeric(opts.index) && opts.index >= 0) {
        insertAt($toolbar, '.btn, .dropdown, h1', opts.index, $result);
    } else {
        $result.insertBefore($title);
    }
}

// Update all buttons
function updateAllButtons() {
    $('.js-toolbar-action').remove();
    buttons.forEach(updateButton);
}

// Remove a button provided its id
function removeButton(id) {
    buttons = $.grep(buttons, function(button) {
        return button.id != id;
    });

    updateAllButtons();
}

// Remove multiple buttons from an array of ids
function removeButtons(ids) {
    buttons = $.grep(buttons, function(button) {
        return ids.indexOf(button.id) == -1;
    });

    updateAllButtons();
}

// When page changed, reset buttons
gitbook.events.on('page.change', function() {
    updateAllButtons();
});

module.exports = {
    createButton: createButton,
    removeButton: removeButton,
    removeButtons: removeButtons
};
