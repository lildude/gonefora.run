# frozen_string_literal: true

source 'https://rubygems.org'

ruby '~> 3.1.0'

gem 'jekyll'

gem 'liquid-c'
gem 'minima-dude', git: 'https://github.com/lildude/minima-dude', branch: 'main'

group :jekyll_plugins do
  # gem 'jekyll-responsive-image'  # TODO: Need to experiment with this more - https://github.com/wildlyinaccurate/jekyll-responsive-image
  gem 'jekyll-feed'
  # gem 'jekyll-feed', git: 'https://github.com/lildude/jekyll-feed', branch: 'lildude-customisations'
  # gem 'jekyll-image-cache', git: 'https://github.com/lildude/jekyll-image-cache', branch: 'main'
  # gem 'jekyll-image-cache', path: '/Users/lildude/Development/jekyll-image-cache'
  gem 'jekyll-include-cache'
  # gem 'jekyll-loading-lazy'
  gem 'jekyll_picture_tag'
  gem 'jekyll-seo-tag'
  gem 'jekyll-sitemap'
end

group :development, :test do
  gem 'html-proofer'
  gem 'httpclient'
  # gem 'html-proofer', :git => 'https://github.com/lildude/html-proofer.git', :branch => 'iframe-check-https-default'
  gem 'rake'
  gem 'strava-ruby-client'
  gem 'stringex'
  # gem 'minima-dude', path: '/Users/lildude/Sites/minima-dude'
  gem 'webrick', '~> 1.7'
end
