module Jekyll
  class TagIndex < Page
    def initialize(site, base, dir, tag)
      @site = site
      @base = base
      @dir = dir
      @name = 'index.html'
      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), 'tag.html')
      self.data['tag'] = tag
      self.data['title'] = "Tag: #{tag}"
    end
  end
  class TagGenerator < Generator
    safe true
    def generate(site)
      if site.layouts.key? 'tag'
        dir = site.config['tag_dir'] || 'tag'
        site.tags.keys.each do |tag|
          tag_name = tag.gsub(/\s+/, '-').downcase
          #write_tag_index(site, File.join(dir, tag_name), tag)
          site.pages << TagIndex.new(site, site.source, File.join(dir, tag_name), tag)
        end
      end
    end
  end
end
