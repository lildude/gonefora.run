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


## -- Misc Functions -- ##
def ok_failed(condition)
  if (condition)
    puts "OK"
  else
    puts "FAILED"
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
