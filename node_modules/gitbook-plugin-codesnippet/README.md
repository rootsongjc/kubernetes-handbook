# Include code snippets in your GitBook

This plugins makes it easy to import code files or uses variables in codeblocks in your GitBook.

### How to use it?

Add it to your `book.json` configuration:

```
{
    "plugins": ["codesnippet"]
}
```

And then in your content:

```md
This is a code snippet:

{% codesnippet "./myfile.js" %}{% endcodesnippet %}
```

Using a specific language:

```md
This is a code snippet, display as HTML:

{% codesnippet "./myfile.ejs", language="html" %}{% endcodesnippet %}
```

Include a range of lines:

```md
This is a code snippet, display as HTML:

{% codesnippet "./myfile.ejs", lines="2:5" %}{% endcodesnippet %}
```

Code blocks with templating syntax:

```md
This is a code snippet, display as HTML:

{% codesnippet %}
curl {{ book.hostname|d("http://localhost") }}/myapi
{% endcodesnippet %}
```
