# New boilerplate for web-pages!

![12in](src/resources/images/12inches_small.png)

> Pure hits &amp; good music for your ears.

- **ESLint** &mdash; to check your code
- **Bublé** &mdash; to transpile your ES6
- **Rollup.js** &mdash; to bundle everything
- **Live Reload** &mdash; to quick reload on dev!
- **LESS** for NodeJS &mdash; y'know ;-)
- **Pug** for static pages (or JST)

## Installation

```bash
$ npx degit tacoss/plate website
```

Once done just move inside with `cd website` and continue reading.

## How it works?

It includes a simplified `Makefile` for quick usage:

- `make dev` to start the development server, it'll wait for you!
- `make dist` to build the final assets for production
- `make clean` to remove all generated files

Type `make` without arguments to display usage info.

> Read the [tarima docs](https://github.com/tacoss/tarima#tarima) to know more about the tooling used.

Deployment is designed to go through GitHub pages, so `make deploy` would do all the required job for you.

> If something gets wrong try `make clean dist` before deploying.

Files found at `./build` are ready to be served.

## Why not something else?

I tried (several times) to setup all goods from this repository: deps, pages, assets, etc. with Webpack, Rollup.js or even Parcel without any success yet.

So, that's why I maintain stuff like this.

Enjoy!
