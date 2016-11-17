rimraf = require('rimraf')
path = require('path')
Glug = require('../')
sinon = require('sinon')
chai = require('chai')
should = chai.should()

test_tpl_path = 'https://github.com/jenius/sprout-test-template.git'
base_path = __dirname
new_path = path.join(base_path, 'init')


describe 'init', ->

  beforeEach (done) ->
    rimraf.sync(new_path, done())

  it 'should error if not given a path', ->
    (-> Glug.init()).should.throw

  it 'should create a project'
