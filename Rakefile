# frozen_string_literal: true

require 'rubygems'
require 'bundler/setup'
require 'yaml'
require 'html-proofer'
require 'stringex'

## -- Misc Configs -- ##
drafts_dir      = '_drafts'   # directory for draft files
posts_dir       = '_posts'    # directory for blog files
new_post_ext    = 'md'        # default new post file extension when using the new_post task
editor          = ENV['JEKYLL_EDITOR'] || ENV['VISUAL'] || ENV['EDITOR'] # default editor to use
config          = YAML.load_file('_config.yml')

## -- Tasks -- ##

# Usage: rake new_post[title-of-my-new-post], or
#        rake new_post['Title of my new post'], or
#        rake new_post "Title of my new post", or
#        enter at the prompt
desc "Begin a new post in #{drafts_dir}"
task :new, [:title] do |_t, args|
  ARGV.shift # Bump off :new
  ARGV.each { |a| task a.to_sym }
  title = ARGV.first || args.title || get_stdin('Enter a title for your post: ')
  filename = "#{drafts_dir}/#{title.to_url}.#{new_post_ext}"
  if File.exist?(filename)
    abort('rake aborted!') if ask("#{filename} already exists. Do you want to overwrite?", %w[y n]) == 'n'
  end
  puts "Creating new draft post: #{filename}".blue
  File.open(filename, 'w') do |post|
    post.puts <<~POST
      ---
      layout: post
      title: "#{title.gsub(/&/, '&amp;')}"
      date: #{Time.now.strftime('%Y-%m-%d %H:%M:%S %z')}
      tags:
      type: post
      ---
    POST
  end
  system "#{editor} #{filename}"
end

desc 'Rename notes with titles'
task :renamenotestitles do
  Dir.glob("#{posts_dir}/*.md") do |file|
    #puts "working on: #{file}...".blue
    data, content = read_yaml(file)
    next unless file =~ /-\d{5,}\.md/

    puts "old: #{file}".blue
    prefix = file.split("-")[0..2].join("-")
    new_name = "#{prefix}-#{content.split(%r{ |-}).first(5).join(" ").to_url}.md"
    puts "new: #{new_name}".pink
    File.rename(file, new_name)
    system("git rm #{file}")
    system("git add #{new_name}")
  end
end

desc 'Rename notes'
task :renamenotes do
  Dir.glob("#{posts_dir}/*.md") do |file|
    #puts "working on: #{file}...".blue
    data, content = read_yaml(file)
    next if data["title"]

    puts "old: #{file}".blue
    prefix = file.split("-")[0..2].join("-")
    new_name = "#{prefix}-#{content.split(%r{ |-}).first(5).join(" ").to_url}.md"
    puts "new: #{new_name}".pink
    File.rename(file, new_name)
    system("git rm #{file}")
    system("git add #{new_name}")
  end
end
desc 'Rename insta'
task :renameinsta do
  Dir.glob("#{posts_dir}/*.md") do |file|
    #puts "working on: #{file}...".blue
    data, content = read_yaml(file)
    next if data["layout"] != "photo"

    puts "old: #{file}".blue
    prefix = file.split("-")[0..2].join("-")
    new_name = "#{prefix}-#{data["title"].gsub(/…/, "").to_url}.md"
    puts "new: #{new_name}".pink

    File.rename(file, new_name)
    system("git rm #{file}")
    system("git add #{new_name}")
  end
end


YAML_FRONT_MATTER_REGEXP = /\A(---\s*\n.*?\n?)^((---|\.\.\.)\s*$\n?)/m

def read_yaml(file)
  if File.read(file) =~ YAML_FRONT_MATTER_REGEXP
    data, content = YAML.load($1), Regexp.last_match.post_match
  end
end


# Usage: rake note "The test of your note", or
#        rake note ["The text of your note"], or
#        enter at the prompt
desc 'Write new short post in _posts'
task :note, [:note] do |_t, args|
  ARGV.shift # Bump off :note
  ARGV.each { |a| task a.to_sym }
  now = DateTime.now
  date = DateTime.now.strftime('%F')
  note = ARGV.first || args.note || get_stdin('Enter your note: ')
  # Make filename from first 5 words
  filename = "#{posts_dir}/#{date}-#{note.split.first(5).join(' ').to_url}.#{new_post_ext}"

  if File.exist?(filename)
    abort('rake aborted!') if ask("#{filename} already exists. Do you want to overwrite?", %w[y n]) == 'n'
  end
  puts "Creating new short post: #{filename}".blue
  File.open(filename, 'w') do |post|
    post.puts <<~CONTENT
      ---
      layout: note
      date: #{now.strftime('%Y-%m-%d %H:%M:%S %z')}
      tags:
      - note
      type: post
      ---

      #{note}
    CONTENT
  end
  # system "#{editor} #{filename}"
end

desc "Publish a draft post in #{drafts_dir}"
task :publish, :draft_file do |_t, args|
  draft_post = args.draft_file || (system("ls -lr #{drafts_dir}") && get_stdin("\nEnter draft post filename: "))
  filename = "#{drafts_dir}/#{draft_post}"
  puts "Publishing #{draft_post}".yellow
  # Update the date to the publish date
  post = File.read(filename)
  File.write(filename, post.sub!(/^date:.*?$/, "date: #{Time.now.strftime('%Y-%m-%d %H:%M:%S %z')}"))
  # Get post title for nice commit message.
  f = YAML.load_file(filename)
  post_title = f['title']
  system("git mv #{filename} #{posts_dir}/#{Time.now.strftime('%Y-%m-%d')}-#{draft_post}")
  system("git commit -am \"Publishing: #{post_title} \"")
end

# Requires ImageOptim and ImageOptim-CLI
desc 'Minify img'
task :minify do
  file_exts = ['.gif', '.jpg', '.jpeg', '.png', '.JPG']
  images = ''
  # Grab time of last compress run
  last_run = if File.exist?('img/.last-compressed')
               Time.at(IO.readlines('img/.last-compressed')[1].strip.to_i)
             else
               Time.new(1990)
             end
  Dir.glob('img/**/*.*') do |file|
    case File.extname(file)
    when *file_exts
      images << "#{file}\n" if File.stat(file).mtime > last_run
    end
  end

  unless images.empty?
    puts "\n## Compressing new images".yellow
    puts images
    ok_failed(system("echo \"#{images}\" | ~/bin/ImageOptim-CLI-1.11.6/bin/imageoptim --image-alpha --quit"))
    # Write last compressed date to file.
    t = Time.now
    File.open('img/.last-compressed', 'w+') { |f| f.puts "# #{t}\n#{t.to_i}" }
    ok_failed(system('git add img'))
    ok_failed(system('git commit -m "Optimise images" 1>/dev/null'))
  end
end

desc 'Test site'
task :test do
  sh 'JEKYLL_ENV=production bundle exec jekyll doctor'
  sh 'JEKYLL_ENV=production bundle exec jekyll build'
  HTMLProofer.check_directory('./_site', {
                                assume_extension: true,
                                check_favicon: true,
                                check_html: true,
                                disable_external: true,
                                # Disabled until https://github.com/gjtorikian/html-proofer/issues/363 is fixed
                                check_img_http: false,
                                check_iframe_http: true,
                                check_opengraph: true,
                                cache: { timeframe: '2w' },
                                empty_alt_ignore: true,
                                file_ignore: ['./_site/admin/index.html'],
                                verbose: true,
                                # Matches /foo/doo but not //foo/doo - useful for protocol-less links.
                                href_swap: { %r{ (?<!\/)^\/{1}(?!\/) } => config['url'] },
                                typhoeus: { verbose: true, followlocation: true },
                                parallel: { in_processes: 3 }
                              }).run
end

desc 'Generate and display locally'
task :server do
  system('JEKYLL_ENV=local bundle exec jekyll serve --profile --watch --drafts --baseurl= --limit_posts=20 --livereload')
end

## -- Misc Functions -- ##
def ok_failed(condition)
  if condition
    puts '=> OK'.green
  else
    warn '=> FAILED'.red
  end
end

def get_stdin(message)
  print message
  STDIN.gets.chomp
end

def ask(message, valid_options)
  if valid_options
    answer = get_stdin("#{message} #{valid_options.to_s.gsub(/"/, '').gsub(/, /, '/')} ".yellow) until valid_options.include?(answer) # rubocop:disable Layout/LineLength
  else
    answer = get_stdin(message)
  end
  answer
end

# My simple copy of the colorize gem without the bloat
class String
  # colorization
  def colorize(color_code)
    "\e[#{color_code}m#{self}\e[0m"
  end

  def red
    colorize(31)
  end

  def green
    colorize(32)
  end

  def yellow
    colorize(33)
  end

  def blue
    colorize(34)
  end

  def pink
    colorize(35)
  end
end
