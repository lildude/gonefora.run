require "rubygems"
require "bundler/setup"
require "stringex"
require "reduce"
require "yaml"

## -- Misc Configs -- ##
public_dir      = "_site"     # compiled site directory
stash_dir       = "_stash"    # directory to stash posts for speedy generation
drafts_dir      = "_drafts"   # directory for draft files
posts_dir       = "_posts"    # directory for blog files
new_post_ext    = "md"        # default new post file extension when using the new_post task
editor          = "atom"      # default editor to use to open and edit your new posts

## -- Tasks -- ##

# usage rake new_post[my-new-post] or rake new_post['my new post'] or rake new_post (defaults to "new-post")
desc "Begin a new post in #{posts_dir}"
task :new, :title do |t, args|
  title = args.title || get_stdin("Enter a title for your post: ")
  #filename = "#{drafts_dir}/#{Time.now.strftime('%Y-%m-%d')}-#{title.to_url}.#{new_post_ext}"
  filename = "#{drafts_dir}/#{title.to_url}.#{new_post_ext}"
  if File.exist?(filename)
    abort("rake aborted!") if ask("#{filename} already exists. Do you want to overwrite?", ['y', 'n']) == 'n'
  end
  puts "Creating new draft post: #{filename}"
  open(filename, 'w') do |post|
    post.puts "---"
    post.puts "layout: post"
    post.puts "title: \"#{title.gsub(/&/,'&amp;')}\""
    post.puts "date: #{Time.now.strftime('%Y-%m-%d %H:%M:%S %z')}"
    post.puts "tags:"
    post.puts "- "
    post.puts "type: post"
    post.puts "published: true"
    post.puts "---"
  end
  system "#{editor} #{filename}"
end

desc "Publish a draft post in #{drafts_dir}"
task :publish, :draft_file do |t, args|
  draft_post = args.draft_file || (system("ls -lr #{drafts_dir}") && get_stdin("\nEnter draft post filename: "))
  filename = "#{drafts_dir}/#{draft_post}"
  puts "Publishing #{draft_post}".yellow
  # Update the date to the publish date
  post = File.read(filename)
  File.write(filename, post.gsub(/^date:.*?/, "date: #{Time.now.strftime('%Y-%m-%d %H:%M:%S %z')}"))
  # Get post title for nice commit message.
  f = YAML.load_file(filename)
  post_title = f["title"]
  system("git mv #{filename} #{posts_dir}")
  system("git commit -am \"Publishing: #{post_title} \"")
end

# Taken from http://davidensinger.com/2013/08/how-i-use-reduce-to-minify-and-optimize-assets-for-production/
desc "Minify _site/"
task :minify, :dir do |t, args|
  dir = args.dir || "_site/"
  if dir == "_site/"
    file_exts = [".css", ".html", ".js", ".xml"]
  else
    file_exts = [".gif", ".jpg", ".jpeg", ".png"]
  end
  puts "\n## Compressing static assets in #{dir}".yellow
  original = 0.0
  compressed = 0
  Dir.glob("#{dir}**/*.*") do |file|
    case File.extname(file)
    when *file_exts
        puts "Processing: #{file}"
        original += File.size(file).to_f
        min = Reduce.reduce(file)
        File.open(file, "w") do |f|
          f.write(min)
        end
        compressed += File.size(file)
      else
        puts "Skipping: #{file}"
      end
  end
  puts "Total compression %0.2f\%" % (((original-compressed)/original)*100)
end

# Taken from http://davidensinger.com/2013/07/automating-jekyll-deployment-to-github-pages-with-rake/ and changed for the gh-pages branch
desc "Deploy _site/ to gh-pages branch"
task :deploy_gh do
  puts "\n## Deleting gh-pages branch".yellow
  ok_failed(system("git branch -D gh-pages 1>/dev/null"))
  puts "\n## Creating new gh-pages branch and switching to it".yellow
  ok_failed(system("git checkout -b gh-pages 1>/dev/null"))
  puts "\n## Generating _site content".yellow
  ok_failed(system("jekyll build 1> /dev/null"))
  puts "\n## Removing _site from .gitignore".yellow
  ok_failed(system("sed -i '' -e 's/_site//g' .gitignore"))
  puts "\n## Miniying _site".yellow
  ok_failed(Rake::Task["minify"].execute)
  puts "\n## Adding _site".yellow
  ok_failed(system("git add .gitignore _site"))
  message = "Build site at #{Time.now.utc}"
  puts "\n## Building site".yellow
  ok_failed(system("git commit -m \"#{message}\" 1>/dev/null"))
  puts "\n## Forcing the _site subdirectory to be project root".yellow
  ok_failed(system("git filter-branch --subdirectory-filter _site/ -f 1>/dev/null"))
  puts "\n## Switching back to master branch".yellow
  ok_failed(system("git checkout master 1>/dev/null"))
  puts "\n## Pushing all branches to origin".yellow
  ok_failed(system("git push origin gh-pages --force 1>/dev/null"))
end

desc "Deploy to Digital Ocean"
task :deploy do
  puts "\## Deploying to Digital Ocean".yellow
  ok_failed(system("git push deploy master"))
end

# usage rake isolate[my-post]
# TODO: Detect images in this post and only minify these.
desc "Move all other posts than the most recently changed to a temporary stash location (stash) so regenerating the site happens much more quickly."
task :isolate, :filename do |t, args|
  stash_dir = "#{source_dir}/#{stash_dir}"
  FileUtils.mkdir(stash_dir) unless File.exist?(stash_dir)
  Dir.glob("#{source_dir}/#{posts_dir}/*.*") do |post|
    FileUtils.mv post, stash_dir unless post.include?(args.filename)
  end
end

desc "Move all stashed posts back into the posts directory, ready for site generation."
task :integrate do
  FileUtils.mv Dir.glob("#{source_dir}/#{stash_dir}/*.*"), "#{source_dir}/#{posts_dir}/"
end




## -- Misc Functions -- ##
def ok_failed(condition)
  if (condition)
    puts "=> OK".green
  else
    puts "=> FAILED".red
  end
end

def get_stdin(message)
  print message
  STDIN.gets.chomp
end

def ask(message, valid_options)
  if valid_options
    answer = get_stdin("#{message} #{valid_options.to_s.gsub(/"/, '').gsub(/, /,'/')} ") while !valid_options.include?(answer)
  else
    answer = get_stdin(message)
  end
  answer
end

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

  def pink
    colorize(35)
  end
end
