# BarefootRunner.co.uk

This is the source repository for [barefootrunner.co.uk](http://barefootrunner.co.uk).

This is really of no interest to anyone other than me and is for the moment a scratchpad documenting my migration of this site from Habari to Jekyll and then possibly on to GitHub Pages.

1 Aug '14 - Still undecided if I should host the static files myself or use GitHub Pages.

## How I did it
- Forked the [Habari Export](https://github.com/habari-extras/export) plugin and enhanced it so that it produced a more consistent and up-to-date WordPress compatible WXR file.
- Exported my site to a WXR file using my modified version of the [Export plugin](https://github.com/lildude/export)
- Cloned the [Hyde Jekyll theme](https://github.com/poole/hyde) locally
- Cloned the [Wordpress.com Jekyll import plugin](http://import.jekyllrb.com/docs/wordpressdotcom/) to [lildude/jekyll-import](https://github.com/lildude/jekyll-import) and modified it to:
  - set absolute pathnames for all images
  - not output frontmatter that is not set or that I'm not interested in
- Created a temporary jekyll "blog": `jekyll new blog`
- Added the following Gemfile to the root of the new temporary blog:

  ```
  source "https://rubygems.org"
  gem "jekyll-import", path: "/path/to/my/local/jekyll-import"
  gem "sequel"
  gem "hpricot"
  ```

- Ran `bundle install` to install all the gems
- Copied my exported WXR file to the root of the temporary blog
- Created the following ruby script to perform the import:

  ```
  require "jekyll-import"

  JekyllImport::Importers::WordpressDotCom.run({
        "source" => "import.xml",
        "no_fetch_images" => false,
        "assets_folder" => "assets"
  })
  ```

- Import all posts: `bundle exec ruby import.rb`
- Copied all posts in `_links` to `_posts` and changed the post type and layout in the process using:

  ```
  for x in `ls -1 _links/`; do
  sed -e 's/type: link/type: post/' -e 's/layout: link/layout: post/' _links/$x > _posts/$x
  done
  ```

- Created individual directories for each of the files in `_pages` and copied the files to `[pagename]/index.html` - because I like pretty URLs without `.html`

  ```
  for x in `ls -1 _pages/`; do
  dir=`echo $x | cut -d- -f4 | cut -d. -f1`
  mkdir $dir
  cp _pages/$x $dir/index.html
  done
  ```


## Todos

- [x] Remove fields from the frontmatter of each post that I don't use (categories, meta, author, status)
- [ ] Customize & optimize the theme
- [ ] Switch out all emoticons for emoji
- [x] Set absolute image paths - they're all relative assets/[filename] which works on the front page, but not the individual posts page
- [ ] Check each individual post & page and make they all render correctly.
- [x] Update Export plugin to grab all content types, not just posts and pages
- [x] Add alignleft, alignright and center CSS for imgs
- [ ] Convert as much HTML to markdown as possible.
- [ ] Catch all changed URLs with the [Jekyll Redirect From plugin](https://github.com/jekyll/jekyll-redirect-from/)
- [ ] Add a sitemap.xml
- [ ] Add Google Analytics
- [ ] Add Google Adsense
- [ ] Add Google Webmaster tools header
- [x] Get date into frontmatter else it's anyone's guess when the posts were originally created.
- [x] Add a Rakefile and borrow some of the ideas from Octopress
