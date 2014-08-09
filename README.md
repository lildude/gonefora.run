# BarefootRunner.co.uk

This is the source repository for [barefootrunner.co.uk](http://barefootrunner.co.uk).

This is really of no interest to anyone other than me and is for the moment a scratchpad documenting my migration of this site from Habari to Jekyll and then possibly on to GitHub Pages.

1 Aug '14 - Still undecided if I should host the static files myself or use GitHub Pages.

## How I did it
- Forked the [Habari Export](https://github.com/habari-extras/export) plugin and enhanced it so that it produced a more consistent and up-to-date WordPress compatible WXR file.
- Exported my site to a WXR file using my modified version of the [Export plugin](https://github.com/lildude/export)
- Cloned the [Hyde Jekyll theme](https://github.com/poole/hyde) locally
- Used the [Wordpress.com Jekyll import plugin](http://import.jekyllrb.com/docs/wordpressdotcom/) to import the WXR file to a temporary jekyll "blog"
- Copied all posts in `_links` to `_posts` and changed the post type in the process using:

  ```
  $ for x in `ls -1`; do
  for> sed 's/type: link/type: post/' $x > ../_posts/$x
  for> done
  $
  ```

- Created individual directories for each of the files in `_pages` and copied the files to `[pagename]/index.html` - because I like URLs without `.html`


## Todos

- [ ] Remove fields from the frontmatter of each post that I don't use
- [ ] Customize & optimize the theme
- [ ] Switch out all emoticons for emoji
- [ ] Set absolute image paths - they're all relative assets/[filename] which works on the front page, but not the individual posts page
- [ ] Check each individual post & page and make they all render correctly.
- [x] Update Export plugin to grab all content types, not just posts and pages
