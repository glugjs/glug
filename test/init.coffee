rimraf = require('rimraf')
path = require('path')
Glug = require('../')
sinon = require('sinon')

test_tpl_path = 'https://github.com/jenius/sprout-test-template.git'
base_path = __dirname
new_path = path.join(base_path, 'init')


describe 'init', ->

  beforeEach (done) ->
    rimraf.sync(new_path, done())

  it 'should reject if not given a path', ->
    Glug.init().should.be.rejected

  it 'should create a project', (done) ->
    spy = sinon.spy()
    Glug.init(new_path)
    .progress(spy)
    .catch(done)
    .done (proj) ->
      proj.root.should.exist
      spy.should.have.callCount(2)
      spy.should.have.been.calledWith('base template added')
      spy.should.have.been.calledWith('project created')
      rimraf(new_path, done)
