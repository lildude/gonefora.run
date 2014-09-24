require "rubygems"
require "bundler/setup"
require "stringex"

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
  if args.title
    title = args.title
  else
    title = get_stdin("Enter a title for your post: ")
  end
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

# Taken from http://davidensinger.com/2013/08/how-i-use-reduce-to-minify-and-optimize-assets-for-production/
# TODO: Add an "all" option
# TODO: Add an option that only optimizes the latest post
require "reduce"
desc "Minify _site/"
task :minify do
  puts "\n## Compressing static assets"
  original = 0.0
  compressed = 0
  Dir.glob("_site/**/*.*") do |file|
    case File.extname(file)
      #when ".css", ".gif", ".html", ".jpg", ".jpeg", ".js", ".png", ".xml"
      when ".css", ".html"
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
task :deploy do
  puts "\n## Deleting gh-pages branch"
  status = system("git branch -D gh-pages")
  puts status ? "Success" : "Failed"
  puts "\n## Creating new gh-pages branch and switching to it"
  status = system("git checkout -b gh-pages")
  puts status ? "Success" : "Failed"
  puts "\n## Generating _site content"
  status = system("jekyll build")
  puts status ? "Success" : "Failed"
  puts "\n## Removing _site from .gitignore"
  status = system("sed -i '' -e 's/_site//g' .gitignore")
  puts status ? "Success" : "Failed"
  puts "\n## Miniying _site"
  Rake::Task["minify"].execute
  puts "\n## Adding _site"
  status = system("git add .gitignore _site")
  puts status ? "Success" : "Failed"
  message = "Build site at #{Time.now.utc}"
  puts "\n## Building site"
  status = system("git commit -m \"#{message}\"")
  puts status ? "Success" : "Failed"
  puts "\n## Forcing the _site subdirectory to be project root"
  status = system("git filter-branch --subdirectory-filter _site/ -f")
  puts status ? "Success" : "Failed"
  puts "\n## Switching back to master branch"
  ok_failed(system("git checkout master"))
  puts status ? "Success" : "Failed"
  puts "\n## Pushing all branches to origin"
  status = system("git push origin gh-pages --force")
  ok_failed(status)
end


module Colors
  def colorize(text, color_code)
    "\033[#{color_code}m#{text}\033[0m"
  end

  {
    :black    => 30,
    :red      => 31,
    :green    => 32,
    :yellow   => 33,
    :blue     => 34,
    :magenta  => 35,
    :cyan     => 36,
    :white    => 37
  }.each do |key, color_code|
    define_method key do |text|
      colorize(text, color_code)
    end
  end
end

## -- Misc Functions -- ##
def ok_failed(condition)
  if (condition)
    puts green "OK"
  else
    puts red "FAILED"
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
