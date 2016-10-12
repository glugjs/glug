console.log 'script started'
fs = require('graceful-fs')
path = require('path')
chokidar = require('chokidar')
transformer = require('jstransformer')
recursive = require('fs-readdir-recursive')
matter = require('gray-matter')
config = require('./config')
b_sync = require('browser-sync')
hljs = undefined
jeet = require('jeet')
rupture = require('rupture')
axis = require('axis')
#
console.log('done with requires')

bs = b_sync.create()

print = console.log

json = (data) ->
  print JSON.stringify(data, null, 2)

merge = ->
  new_object = {}
  for object in arguments
    for key of object
      new_object[key] = object[key]
  new_object

write_file = (path, contents) ->
  # print "About to write #{path}"
  # print "Writing #{contents["body"]} to #{path}"

  fs.writeFile path, contents, (err) ->
    if err
      throw err

rm_dir = (path) ->
  if fs.existsSync(path)
    fs.readdirSync(path).forEach (file, index) ->
      curPath = path + '/' + file
      if fs.lstatSync(curPath).isDirectory()
        # recurse
        deleteFolderRecursive curPath
      else
        # delete file
        fs.unlinkSync curPath
      return
    fs.rmdirSync path

transformers = {}

transformers = merge(transformers, config.transformers)
# if transformers.stylus? and transformers.stylus.use_modules?
#   for module, i in transformers.stylus.use_modules
#     # transformers.stylus.use_modules.splice(i, 1)
#     print "module is #{module}"
#     print "require(\"#{module}\")"
#     required_module = require(module)
#     print required_module
#     transformers.stylus.use ||= []
#     transformers.stylus.use.push(required_module)
#     print required_module is null

#     json transformers.stylus

renderers = {}

print 'about to require jstransformers'
for name, options of transformers
  print "require(\"jstransformer-#{name}\")"
  renderers[name] = transformer(require("jstransformer-#{name}"))

print 'done requiring jstransformers'

paths = {}

input_dir  = config.input_dir  || 'app'
output_dir = config.output_dir || 'public'

if config.transformers['markdown-it'].highlight?
  hljs = require('highlight.js')
  transformers['markdown-it'].highlight = (str, lang) ->
    if lang and hljs.getLanguage(lang)
      try
        return hljs.highlight(lang, str).value
      catch __
    ''

transformers_for = (filetype) ->
  renderer_names = []
  for name, transformer of transformers
    renderer = renderers[name]
    if renderer.inputFormats.includes(filetype)
      renderer_names.push name

  if renderer_names.length is 0
    print 'renderer_names is empty'
    return []

  last_renderer_name = renderer_names[renderer_names.length - 1]
  last_extension = renderers[last_renderer_name].outputFormat
  if last_extension isnt filetype
    for new_renderer in transformers_for(last_extension)
      renderer_names.push new_renderer

    # print "#{filetype} => #{last_extension}"
  return renderer_names

print 'starting making file list'


all_files = recursive(input_dir)

all_files = all_files.map (file) ->
  path.join(input_dir, file)

files = []

for file in all_files
  if path.basename(file)[0] isnt '_'
    files.push(file)

print 'making file list'

bs_options = merge({
  server: output_dir
}, config.browsersync)

bs.init(bs_options)

rm_dir output_dir

unless fs.existsSync(output_dir)
  fs.mkdir(output_dir)

render = (contents, input_format, settings={}, callback) ->
    file_data = matter(contents)

    contents = file_data.content
    frontmatter = file_data.data

    renderer_names = transformers_for input_format

    renderer_name = renderer_names[0]

    renderer_config = transformers[renderer_name]

    json renderer_names
    print "Using renderer #{renderer_name}"
    renderer = renderers[renderer_name]

    output_format = renderer.outputFormat

    # print "renderer: #{renderer_name}, input: #{input_format}, output: #{output_format}"

    default_transformers_config =
      stylus:
        paths: [
          input_dir
        ]

    renderer_config = merge(settings, renderer_config, {filename: file}, frontmatter)
    # renderer_config = merge(renderer_config, frontmatter)

    # json renderer_config

    renderer.renderAsync(contents, renderer_config, (err, rendered_contents) ->
      if err
        throw err
      
      rendered_contents = rendered_contents.body
      renderer_names.shift()

      if output_format is 'html'
        frontmatter.layout ||= config.default_layout || 'layout'

      if frontmatter.layout? and not renderer_config.is_layout
        layout_location = "#{input_dir}/#{config.views_dir}/#{frontmatter.layout}.#{config.layout_extension}"
        fs.readFile layout_location, { encoding: 'utf8' }, (err, text) ->

          if err
            throw err

          layout_config = merge(renderer_config, 
            contents: rendered_contents
            is_layout: true
          )

          render(text, config.layout_extension, layout_config, callback)

      else if renderer_config.is_layout
        callback(rendered_contents)
      else if renderer_names.length > 0
        render(rendered_contents, output_format, {}, callback)
      else if callback?
        callback(rendered_contents)

    )

render_file = (file) ->
  extension = path.extname(file).replace('.', '')

  renderer_names = transformers_for extension

  renderer_name = renderer_names[0]

  renderer = renderers[renderer_name]

  new_extension = renderer.outputFormat
  basename = path.basename(file, extension)
  new_name = basename + new_extension
  new_path = path.join(output_dir, new_name)

  print "Rendering #{new_path}"

  fs.readFile file, { encoding: 'utf8' }, (err, text) ->

    if err
      throw err

    render(text, extension, {}, (rendered_contents) ->
      write_file(new_path, rendered_contents)
    )

  return new_path

print 'about to start looping through files and rendering them'
for file in files
  render_file(file)

chokidar.watch(input_dir, {}).on 'all', (event, file) ->
  if event is 'change'
    files_to_reload = [file]

    if file.includes('layout')
      for file in files
        files_to_reload.push file

    for file in files_to_reload
      output_file = render_file(file).replace(output_dir + '/', '')
      bs.reload(output_file)

print 'script ended'
