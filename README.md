
# Static boilerplate

> All &mdash;non-quite-trendy&mdash; batteries Included!

- **ESLint** &mdash; to check your code
- **Bublé** &mdash; to transpile your ES6
- **Rollup.js** &mdash; to bundle everything
- **Live Reload** &mdash; to quick reload on dev!
- **Vue** template-compiler &amp; runtime
- **SASS** for NodeJS &mdash; y'know ;-)
- **Pug** for static pages (or JST)

## Installation

```bash
$ npx degit tacoss/boilerplate my-project
```

Or just clone/download this repository and follow the next steps:

## How it works?

- `make dev` to start the development server, it'll wait for your changes
- `make dist` to build the final assets for production
- `make clean` to remove all generated files

All sources starting with `_` are be skipped from processing, remaining ones are compiled based on their extension, e.g. `src/content/pages/example.js.pug` will produce a client-function from Pug compiler.

Read the [tarima docs](https://github.com/tacoss/tarima#tarima).

## Why not something else?

I tried (several times) to setup all goods from this repository: deps, pages, assets, etc. with Webpack, Rollup.js or even Parcel without any success yet.

So, that's why I maintain stuff like this.

Enjoy!
