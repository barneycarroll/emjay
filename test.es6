import test from 'tape'
import mj   from './index.es6'

test( 'Produces a string from pipe content', t =>
  t.equal( mj`| Hello`, 'Hello' )
)
