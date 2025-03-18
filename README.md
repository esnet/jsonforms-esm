# JSONForms Vue WebComponent ESM


## Background and Wrapper Notes

This Repo contains a Vue wrapper for the JSONForms library.

The Vue3 wrapper builds a WebComponent. The standard Vue3 build tools cannot yield a webcomponent.

But! Using Vite as a build tool allows us to build the WebComponent and bundle it into into an ECMAScript module.

ECMAScript modules can be `import`ed directly into a browser, or included as a `<script>` tag.

WebComponents are a web standard (a built-in part of JavaScript) that allows users to create user-defined HTML Tags that can be used in HTML `<like></like>` `<this></this>`.


## OK... Why bother?

This allows you to use JSONForms in a totally vanilla web browser environment in HTML with no modification, using only a `<script>` tag.

Well, and a `<link>` tag if you want CSS.

But, for your target application, this means: use JSONForms with no NodeJS, no NPM, and no build step.

This stems from a development philosophy:
  - use a simple tool, not a complicated tool
  - avoid JavaScript
  - avoid node, npm and friends
  - avoid transpiling


## Why would I want JSONForms?

You probably already know if you're here, but JSONForms allows you to render a form based on a JSON Schema.


## OK, I'm sold, how do I use it?

You include a `<script>` tag, and then use the `<json-form>` tag.

Here's a complete code listing:

```
<!DOCTYPE html>
<html>
<head>
    <title>JSONForms Demo</title>

    <!-- load CSS Styling for JSONForms from unpkg -->
    <link rel='stylesheet' type='text/css' href='https://unpkg.com/jsonforms-esm@v3.5.1/dist/jsonforms.css'>
    <!-- load JSONForms from unpkg -->
    <script src='https://unpkg.com/jsonforms-esm@v3.5.1/dist/jsonforms.esm.js'></script>
</head>
<body>
    <json-form></json-form>
</body>
</html>
```

## Live demo

https://unpkg.com/jsonforms-esm@3.5.1/dist/index.html


## What if I want to version pin or serve a copy? (Flat-file lifecycle management)

- Use your favorite download tool (web browser, curl, fetch, etc) to retrieve a copy of the ESM file:
   https://unpkg.com/jsonforms-esm@v3.5.1/dist/jsonforms.esm.js

- Use your favorite download tool (web browser, curl, fetch, etc) to retrieve a copy of the CSS file:
   https://unpkg.com/jsonforms-esm@v3.5.1/dist/jsonforms.css

- You now have the whole library

- put these in your project in folder called `/lib`, with a version suffix, like:
   ```
   cp /path/to/downloaded/jsonforms.esm.js /path/to/project/lib/jsonforms.3.5.1.esm.js
   cp /path/to/downloaded/jsonforms.css /path/to/project/lib/jsonforms.3.5.1.css
   ```

- now, create symlinks, so you can manage the versions in the future. (Use the link in your HTML, the link's target is an ephemeral copy)

   ```
   ln -s jsonforms.3.5.1.esm.js jsonforms.esm.js
   ln -s jsonforms.3.5.1.css jsonforms.css
   ```

- commit the whole `/lib` directory

- now, in your project you can use a link and script tag like this:
  ```
  <link rel='stylesheet' type='text/css' href='lib/jsonforms.css'>
  <script src='lib/jsonforms.esm.js'></script>
  ```


## OK But that's too weird, what is this the 90s? I want NPM & friends so I can have more build and bundling problems!

`npm install jsonforms-esm`

Actually, you should probably just use jsonforms: `https://jsonforms.io/`

Enjoy your developer experience.

