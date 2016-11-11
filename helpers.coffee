h =
  to_array: (object) ->
    array = []
    i = 0

    for key, value of object
      array[i] = {}
      # array[i].test = "sdfs"
      array[i].name = key
      array[i].data = value
      i++

    return array

  each_in: (object, fn) ->
    if typeof object is 'array'
      for item in object
        fn(item)
    else
      for item_name, item_data of object
        item = {}
        item.name = item_name
        item.data = item_data
        fn(item)

  next: (object, current) ->
    array = Object.keys(object)
    next_key = array[array.indexOf(current) + 1]
    value = {}
    value.data = object[next_key]
    value.name = next_key
    if value.data?
      return value

  first: (object) ->
    if typeof object is 'object'
      value = {}
      value.name = Object.keys(object)[0]
      value.data = object[value.name]
      return value
    else
      object[0]

  last: (object) ->
    if typeof object is 'object'
      value = {}
      value.name = Object.keys(object)[Object.keys(object).length - 1]
      value.data = object[value.name]
      return value
    else
      object[object.length - 1]

  json: ->
    ('\n' + JSON.stringify arguments..., null, 2)

  print: console.log

  merge: ->
    new_object = {}
    for object in arguments
      for key of object
        new_object[key] = object[key]
    new_object

  write_file: (file, contents) ->
    new Promise (resolve, reject) ->
      l.debug "Writing #{file}"

      mkdirp.sync path.dirname(file)
      fs.writeFile file, contents, (err) ->
        if err
          console.error err
          return reject err
        resolve()

  rm_dir: (path) ->
    if fs.existsSync(path)
      fs.readdirSync(path).forEach (file, index) ->
        curPath = path + '/' + file
        if fs.lstatSync(curPath).isDirectory()
          # recurse
          h.rm_dir curPath
        else
          # delete file
          fs.unlinkSync curPath
        return
      fs.rmdirSync path

module.exports = h
