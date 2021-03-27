# Old boilerplate for web-pages!

![12in](https://github.com/tacoss/plate/raw/master/src/resources/images/12inches_small.png)

> Pure hits &amp; good music for your ears.
>
> [![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/remix/dubplate)

## How this is organized?

**public/**

Contains static assets that are copied once you build the files for your website.

- Any file you save here will be public and accessible: fonts, robots.txt, stylesheets, etc.

**src/**

Contains the source-code for your dynamic assets: stylesheets, scripts, images, pages, etc.

- In example, the `404.pug` file here is saved as `build/404.html` &mdash; no folder/index is created like for pages...
- Any file in this directory will be processed by the compiler and then written on the `build` destination.
- Any `components`, `shared` or `lib` directory within will be ignored by the compiler.

**src/app/**

Contains the application code for your javascript webapp, `.js` files in this directory will serve as entry-points.

- In example, the `src/app/main.js` will be saved as `build/main.js` instead.

**src/lib/**

All files in this directory are completely ignored by the compiler.

- Use this directory to place all the code you don't want to publish, any chunk of code like partials, helpers, views, etc.

**src/pages/**

Files here are processed and/or copied to the `build` destination.

- In example, the `src/pages/example.md` will be saved as `build/example/index.html` instead.
- They can be Markdown files, or Pug templates, etc. &mdash; try using some front-matter!

**src/resources/images/**

Images in this directory are processed and copied to the `build` destination, also a `images.css` file will be written.

- Images can be referred from the `build` destination, or through using the generated stylesheet.
- Subdirectories can be used to group images, the stylesheet name will be the same as the folder name.

**src/resources/scripts/**

Scripts in this directory are processed and bundled if possible, they can be almost anything [esbuild](https://esbuild.github.io/) can handle.

- In example, the `src/resources/scripts/app.js` will be saved as `build/app.js` instead.
- By default we're using Svelte as the frontend framework for single-page-applications.

**src/resources/sprites/**

Images (including SVG) in this directory are processed and saved to the `build` destination, also a `sprites.svg` file will be written.

- Images for retina screens MUST be suffixed with `@2x` in order to properly match and group them by name.
- Subdirectories can be used to group sprites, the stylesheet and svg-file name will be the same as the folder name.
- Additional stylesheets for resolving processed image-sprites (not SVG) are generated with the same name as the folder name.

**src/resources/styles/**

Stylesheets in this directory are processed and saved to the `build` destination, they can be Styl, SASS, LESS or PostCSS.

- In example, the `src/resources/styles/main.less` will be saved as `build/main.css` instead.
- By default we're using LESS as the minimal stylesheet pre-processor.

## How to use the command line?

Either you've cloned the repo or enter the CLI on the Glitch app the commands are the same.

- `make` &mdash; Shows all available tasks
- `make dev` &mdash; Start development workflow
- `make test` &mdash; Lint all source files
- `make clean` &mdash; Remove cache files
- `make pages` &mdash; Commit changes to `gh-pages`
- `make deploy` &mdash; Publish changes from `gh-pages`
- `make deps` &mdash; Check and install NodeJS dependencies
- `make dist` &mdash; Process all stuff for production
- `make purge` &mdash; Remove `node_modules` cache
- `make add:*` &mdash; Creates a new file, e.g. `make add:page NAME=about.md BODY='h1 FIXME'`
- `make rm:*` &mdash; Remove existing file, e.g. `make rm:page NAME=about.md`

> Available types for `:*` suffix are: `lib`, `res` and `page` &mdash; otherwise, the filename will be inferred, e.g.
> `make add:robots.txt` will create a `src/robots.txt` file instead (directory separators are disallowed this way).

## How to publish changes to the web?

- You may want to use [Github Pages](https://pages.github.com/) if you're familiar with &mdash; just type `make deploy` and enjoy!
- You may want to use [now](https://now.sh) if you're familiar with &mdash; it already includes a `now.json` file for it.
- You may want to publish your website somewhere else &mdash; the `build` destination is everything you'll need for...

If you've cloned this, there is a preconfigured workflow file to publish through `gh-pages` on every push
&mdash; Modify the `.github/workflows/main.yml` file to disable the `glitch` or `gh-pages` tasks if you don't need them.

The `make deploy` command accepts a `ROOT` variable to configure the `<base />` tag of your generated pages, e.g. `make deploy ROOT=/demo`
&mdash; this is particullary useful if you're setting up a `CNAME` file and you want to publish on a separated folder instead.

## Are you publishing changes from Glitch.com?

If you remixed this template on glitch you may need to export its changes back to GitHub:

<ol>
  <li>
    <p>Make sure you've granted access to your GitHub repositories.</p>
    <img src="https://dev-to-uploads.s3.amazonaws.com/i/xjiw8p0cvikqydutt4ei.png" alt="Grant Access" width="180" />
  </li>
  <li>
    <p>Once you've granted access, you should be able to export your work.</p>
    <img src="https://dev-to-uploads.s3.amazonaws.com/i/fv1errdj2htx4vg1be90.png" alt="Export Repository" width="180" />
  </li>
</ol>

## Well-known issues

_**Github Actions** are failing on the repository_

- The `glitch` task requires you to setup secrets in your repository settings, see [here](https://github.com/kanadgupta/glitch-sync#inputs) for details.
- The `gh-pages` requires an existing branch in your repository named the same way, see below for details.

_**fatal**: couldn't find remote ref gh-pages_

- Create a bare `gh-pages` branch as follows and then go back to `master` to retry the `make deploy` task.
  ```bash
  git checkout --orphan gh-pages
  git rm -rf .
  git commit --allow-empty -m "initial commit"
  git checkout master
  ```
