chai = require('chai')
should = chai.should()
coffee = require('coffee')
path = require('path')

base_path = __dirname
new_path = path.join(base_path, 'init')

describe 'cli', ->

  describe 'root', ->
    it 'should have help info', (done) ->
      coffee.spawn 'glug'
        .expect 'stdout', /Usage/
        .end done
  describe 'build', ->
    it 'should call builder', (done) ->
      coffee.spawn 'glug', ['build']
        .expect 'stdout', /build/
        .end done

    it 'should have debug information', (done) ->
      coffee.spawn 'glug', ['build', '--verbose']
        .expect 'stdout', /verbose/
        .end done

    it 'should have help info', (done) ->
      coffee.spawn 'glug', ['build', '--help']
        .expect 'stdout', /Usage/
        .end done

  describe 'watch', ->
    it 'should call watcher', (done) ->
      coffee.spawn 'glug', ['watch']
        .expect 'stdout', /watch/
        .end done

    it 'should have debug information', (done) ->
      @timeout 3000
      coffee.spawn 'glug', ['watch', '--verbose']
        .expect 'stdout', /verbose/
        .end done

    it 'should have help info', (done) ->
      coffee.spawn 'glug', ['watch', '--help']
        .expect 'stdout', /Usage/
        .end done

  describe 'init', ->
    it 'should call init'
    # it 'should call init', (done) ->
    #   coffee.spawn 'glug', ['init', new_path]
    #     .expect 'stdout', /init/
    #     .end done

    it 'should error without directory argument', (done) ->
      coffee.spawn 'glug', ['init']
        .expect 'stderr', /error: missing required argument `directory'/
        .end done

    it 'should have debug information'
    # it 'should have debug information', (done) ->
    #   coffee.spawn 'glug', ['init', '--verbose', new_path]
    #     .expect 'stdout', /verbose/
    #     .end done

    it 'should have help info', (done) ->
      coffee.spawn 'glug', ['init', '--help']
        .expect 'stdout', /Usage/
        .end done
