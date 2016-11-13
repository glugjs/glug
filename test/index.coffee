chai = require('chai')
should = chai.should()

Glug = require('../')

describe 'Glug', ->

  describe '#init', ->
    it 'should be a function', ->
      Glug.init.should.be.a('function')

  describe '#watch', ->
    it 'should be a function', ->
      Glug.watch.should.be.a('function')

  describe '#build', ->
    it 'should be a function', ->
      Glug.build.should.be.a('function')
