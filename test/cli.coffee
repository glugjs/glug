chai = require('chai')
should = chai.should()

coffee = require('coffee')

describe 'cli', ->

  describe 'root', ->
    it 'should have help info', (done) ->
      coffee.spawn 'glug'
        .expect 'stdout', /Usage/
        .end done

  describe 'build', ->
    it 'should call builder', (done) ->
      @timeout 3000
      coffee.spawn 'glug', ['build']
        .expect 'stdout', /build/
        .end done

    it 'should have debug information', (done) ->
      @timeout 3000
      coffee.spawn 'glug', ['build', '--verbose']
        .expect 'stdout', /verbose/
        .end done

    it 'should have help info', (done) ->
      coffee.spawn 'glug', ['build', '--help']
        .expect 'stdout', /Usage/
        .end done

  describe 'watch', ->
    it 'should call watcher', (done) ->
      @timeout 3000
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
