import test from 'ava'
import glug from '..'

test('glug watch does not fail', t =>
  t.notThrows(() => glug.watch())
)

test.todo('reads config')
