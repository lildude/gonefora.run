# BarefootRunner.co.uk

This is the source repository for [barefootrunner.co.uk](http://barefootrunner.co.uk).

This is really of no interest to anyone other than me and is for the moment a scratchpad documenting my migration of this site from Habari to Jekyll and then possibly on to GitHub Pages.

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
- Copy all posts in `_links` to `_posts` and changed the post type and layout in the process using:
  ```
  for x in `ls -1 _links/`; do
  sed -e 's/type: link/type: post/' -e 's/layout: link/layout: post/' _links/$x > _posts/$x
  done
  ```

- Create individual directories for each of the files in `_pages` and copied the files to `[pagename]/index.html` - because I like pretty URLs without `.html`
  ```
  for x in `ls -1 _pages/`; do
  dir=`echo $x | cut -d- -f4 | cut -d. -f1`
  mkdir $dir
  cp _pages/$x $dir/index.html
  done
  ```

- Create `_drafts` and move all draft posts from `_posts` to `_drafts`:

  ```
  for x in `grep -l "published: false" _posts/*`; do
  new=`echo $x | sed -e 's:_posts/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}-::g'`
  mv $x _drafts/$new
  done
  ```

- Set `published` to true for all drafts as my theme will only display "published" posts when I use `jekyll server --drafts`:

  ```
  for x in `ls -1 _drafts/`; do
  sed -i '' 's/published: false/published: true/' _drafts/$x
  done
  ```

- Download all assets and move them to `assets/` effectively flattening the directory structure
- Update all posts that still refer to old assets which my [lildude/jekyll-import](https://github.com/lildude/jekyll-import) plugin has missed

  ```
  cd _posts
  sed -i.bak -E 's:http\://barefootrunner.co.uk/user/sites/barefootrunner.co.uk/files/(docs|audio|images)/([0-9]{4}/)?:/assets/:g' *
  ```


## How I deploy to my own server

- Add a new remote that is on my hosting server:
  `git add remote deploy user@hosting.srv`
- Add the following `post-receive` hook to it:

  ```
  #!/bin/sh
  PUBLIC_WWW=${HOME}/www/barefootrunner
  rm -rf ${PUBLIC_WWW}/*
  git archive gh-pages | tar -x -C ${PUBLIC_WWW}
  exit
  ```
- deploy using: `git push deploy gh-pages --force`

## Todos

- [x] Remove fields from the frontmatter of each post that I don't use (categories, meta, author, status)
- [ ] Customize & optimize the theme
- [ ] Switch out all emoticons for emoji
- [ ] MAYBE: Use an [emoji font](http://emojisymbols.com/) for emojis instead of local or GitHub hosted
  - [ ] TODO: If I do the above, I need to convert the jemoji plugin to insert unicode chars for each of the :emoji: references
- [x] Set absolute image paths - they're all relative assets/[filename] which works on the front page, but not the individual posts page
- [ ] Check each individual post & page and make they all render correctly.
- [x] Update Export plugin to grab all content types, not just posts and pages
- [x] Add alignleft, alignright and center CSS for imgs
- [ ] Convert as much HTML to markdown as possible.
- [ ] Catch all changed URLs with the [Jekyll Redirect From plugin](https://github.com/jekyll/jekyll-redirect-from/)
- [x] Add a sitemap.xml - using the code from http://davidensinger.com/2013/11/building-a-better-sitemap-xml-with-jekyll/
- [x] Add Google Analytics
- [x] Add Google Adsense
- [x] Add Google Webmaster tools header
- [x] Get date into frontmatter else it's anyone's guess when the posts were originally created.
- [x] Add a Rakefile and borrow some of the ideas from Octopress
  - [x] Create new post
  - [ ] Publish draft post
  - [ ] Stash posts
- [ ] Mark draft posts when running with `--drafts` so I can easily distinguish them.
- [ ] MAYBE: Add fontawesome icons to posts in archives to distinguish types.
- [ ] Use local copies of remote assets when running locally
- [ ] Determine a better method of detecting locally run than the current site.debug method I'm using - can use {{ site.host == 0.0.0.0 }}
- [x] Pre-process locally and save minified content to a branch.  This makes the repo larger, but quicker to deploy.
- [ ] Minify only the content that has recently changed.  Speeds things up considerably
- [x] Add robots.txt

## Research material for enhancing rakefile

- http://davidensinger.com/2013/04/deploying-jekyll-to-github-pages/
- http://davidensinger.com/2013/07/easy-sass-source-maps-with-development-environments-and-rake/
- http://davidensinger.com/2013/08/how-i-use-reduce-to-minify-and-optimize-assets-for-production/
