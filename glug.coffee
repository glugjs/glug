base_path = process.cwd()

require('app-module-path').addPath("#{base_path}/node_modules")
Promise = require('bluebird')
Logdown = require('logdown')
global.program = require('commander')

global.l = new Logdown prefix: 'glug', alignOutput: true

l.debug = ->
  if global.verbose
    l.log arguments...

require_dependencies = ->
  l.debug 'requiring dependencies'
  new Promise (resolve, reject) ->
    global.h = require('./helpers')
    global.fs = require('fs')
    global.path = require('path')
    global.mkdirp = require('mkdirp')
    global.chokidar = require('chokidar')
    global.jstransformer = require('jstransformer')
    global.recursive = require('fs-readdir-recursive')
    global.anymatch = require('anymatch')
    global.matter = require('gray-matter')
    global.browser_sync = require('browser-sync')
    resolve()

config = undefined
config_path = undefined
bs = undefined
transformer_names = undefined
transformers = undefined
input_dir = undefined
output_dir = undefined
paths = {}
files = {}
pipelines = {}

load_config = ->
  new Promise (resolve, reject) ->
    input_dir = config?.input_dir or 'app'
    output_dir = config?.output_dir or 'public'
    config_path = "#{base_path}/glug-config.coffee"

    try
      config = require(config_path)
    catch error
      throw error + "\nConfig file not found at #{config_path}"

    resolve()

start_browser_sync = ->
  bs = browser_sync.create()
  bs.init h.merge({
    server: output_dir
  }, config.server)

load_transformer = (name) ->
  new Promise (resolve, reject) ->
    l.debug "Requiring JSTransformer: **#{name}**"
    try
      transformers[name] = jstransformer(require("jstransformer-#{name}"))
      resolve()
    catch error
      reject l.error """
        #{error}
    
        Try running `npm install --save jstransformer-#{name}`
        or `yarn add jstransformer-#{name}`
        """.replace('Error: ', '')

load_all_transformers = ->
  transformer_names = config.transformers
  transformers = {}
  Promise.map h.to_array(transformer_names), (transformer) ->
    load_transformer(transformer.name)

generate_file_list = ->
  new Promise (resolve, reject) ->
    l.debug 'Making file list...'
    all_files = recursive(input_dir)
    for file in all_files
      files[file] = {}
      files[file].is_rendered = false
      files[file].in_format = path.extname(file).replace('.', '')
      for pipeline_name, pipeline of config.pipelines
        for tier_name, tier of pipeline
          for glob, transforms of tier
            if anymatch(glob, file)

              # Convert transforms to array if necessary
              if typeof transforms is 'string'
                transforms = [transforms]

              if transforms.length is 0
                transforms = ['copy']
                files[file].out_format ||= files[file].in_format

              else
                last_transformer = transformers[h.last(transforms).data]
                files[file].out_format = last_transformer.outputFormat
              files[file].pipeline = pipeline_name
              pipelines[pipeline_name] ||= {}
              pipelines[pipeline_name][tier_name] ||= {}
              pipelines[pipeline_name][tier_name][file] ||= {}
              file_ref = pipelines[pipeline_name][tier_name][file]
              file_ref.transforms ||= []
              file_ref.transforms = file_ref.transforms.concat transforms

      files[file].out_format ||= files[file].in_format
      files[file].out_path = file.replace(
        files[file].in_format,
        files[file].out_format
      )

    l.debug "Files: #{h.json files}"
    l.debug "Pipelines: #{h.json pipelines}"
    l.debug 'File list is finished'
    resolve()

prepare_output_dir = ->
  new Promise (resolve, reject) ->
    try
      h.rm_dir output_dir
      unless fs.existsSync(output_dir)
        fs.mkdir(output_dir)
      resolve()
    catch err
      reject err

start_config_watcher = ->
  chokidar.watch(config_path).on 'change', ->
    load_config()
      .then prepare_output_dir
      .then load_all_transformers
      .then generate_file_list
      .then render_all
      .then bs.reload('*')

start_watcher = ->
  chokidar.watch(input_dir, {}).on 'all', (event, file) ->
    if event is 'change' or event is 'remove' # or event is 'add'     
      file = file.replace input_dir + '/', ''
      file = file.replace input_dir + '\\', ''
      pipeline = files[file].pipeline
      # out_format = files[file].out_format
      out_format = pipeline.toLowerCase()
      files[file].is_rendered = false
      l.debug "`#{file}` #{event}d"
      l.debug "Pipeline to reload is #{pipeline}"
      render_pipeline(name: pipeline, data: pipelines[pipeline])
        .then ->
          console.log "hi"
          bs.reload("*.#{out_format}")

render = (file, contents, transform, settings = {}) ->
  l.debug "Rendering **#{file.name}** with `#{transform}`."

  new Promise (resolve, reject) ->
    bad_things = ['', undefined, null]

    if bad_things.includes contents
      l.warn("I want to render #{file.name}
        with #{transform},
        but I can't because #{file.name} is #{contents}")
      return resolve('')

    if typeof contents isnt 'string'
      l.warn("The contents of #{file.name}
      is of type #{typeof contents}, and is:
        #{h.json contents}")

    file_data = matter(contents)

    contents = file_data.content
    frontmatter = file_data.data

    if transform is 'copy'
      return resolve(contents)

    renderer = transformers[transform]
    output_format = renderer.outputFormat
    renderer_config = h.merge(settings,
      frontmatter,
      config.transformers[renderer.name])

    renderer.renderAsync(contents, renderer_config)
      .then (contents) ->
        # l.debug "#{file.name}: finished rendering with #{renderer.name}"
        return resolve contents.body
      .catch (err) ->
        console.log err
        throw err

    # renderer.renderAsync contents, renderer_config, (err, contents) =>
    #   throw err if err
    #   l.debug "#{file.name}: finished rendering with #{transform}"
    #   return resolve contents.body

render_file_tier = (file, tier, first_tier = true) ->
  # l.debug "#{file.name}: #{tier.name}"
  new Promise (resolve, reject) ->

    file_data = files[file.name]
    # sleep.sleep(1)

    # l.debug "First tier: #{first_tier}"

    out_path = path.join(output_dir, file_data.out_path)
    if first_tier
      file_path = path.join(input_dir, file.name)
    else
      file_path = out_path

    # l.debug "Looking for file at #{file_path}"
    fs.readFile file_path, encoding: 'utf8', (err, text) ->

      if err
        throw l.error err

      transforms = tier.data[file.name].transforms

      Promise.reduce(transforms,
        (contents, transform) ->
          render(file, contents, transform,
            filename: file_path, basedir: output_dir)
          .catch (err) -> throw err
        , text)
        .catch (err) -> throw err
        .then (contents) ->
          h.write_file(out_path, contents)
          file_data.is_rendered = true
          resolve()

render_all_in_tier = (pipeline, tier, first_tier = true) ->
  # l.debug "#{pipeline.name}: #{tier.name}"
  Promise.map h.to_array(tier.data), (file) ->
    rendered = files[file.name].is_rendered
    l.debug "#{file.name} is rendered: #{rendered}"
    # unless rendered
    #   render_file_tier(file, tier, first_tier)
    render_file_tier(file, tier, first_tier)

render_pipeline = (pipeline) ->
  l.debug "**#{pipeline.name} Pipeline**"
  Promise.reduce h.to_array(pipeline.data),
    (acc, tier, i) ->
      first_tier = if i is 0 then true else false
      # l.debug "Rendering tier #{i + 1}
      #   - **#{tier.name}** for
      #   `#{pipeline.name}`"
      promise = render_all_in_tier pipeline, tier, first_tier
      # promise.then ->
      #   l.debug "Finished tier: #{tier.name}"
      return promise
    , 0

render_all = ->
  Promise.map h.to_array(pipelines), (pipeline) ->
    render_pipeline pipeline


class Glug
  init: (directory) ->
    if not directory?
      throw new Error 'Please specify a directory'
    global.verbose = commands.init.verbose
    l.log 'init', ('`verbose`' if verbose)
    l.info "directory is #{directory}"
    require_dependencies().then ->
      Sprout = require('sprout')
      path = require('path')
      os = require('os')
      mkdirp = require('mkdirp')
      inquirer = require('inquirer')
      template_dir = path.join(os.homedir(), '.config/glug')
      mkdirp.sync template_dir
      sprout = new Sprout(template_dir)
      sprout.add('glug', 'https://github.com/glugjs/sprout-glug')
        .then ->
          sprout.init 'glug', directory,
            questionnaire: inquirer.prompt.bind(inquirer)

  watch: (verbose = false) ->
    global.verbose = verbose
    l.log 'watch', ('`verbose`' if verbose)
    require_dependencies()
      .then load_config
      .then start_config_watcher
      .then start_browser_sync
      .then load_all_transformers
      .then generate_file_list
      .then prepare_output_dir
      .then start_watcher
      .then render_all
      .catch (err) -> throw err

  build: (verbose = false) ->
    global.verbose = verbose
    l.log 'build', ('`verbose`' if verbose)
    require_dependencies()
      .then load_config
      .then load_all_transformers
      .then generate_file_list
      .then prepare_output_dir
      .then render_all
      .catch (err) -> throw err




glug = new Glug()

module.exports = glug
