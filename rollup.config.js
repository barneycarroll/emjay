module.exports = {
  entry      : './index.es6',
  dest       : './index.js',
  format     : 'iife',
  sourceMap  : true,
  plugins    : [
    require( 'rollup-plugin-buble' )( {
      transforms : {
        dangerousTaggedTemplateString : true
      }
    } ),
    require( 'rollup-plugin-commonjs' )( {
      include : './node_modules/**'
    } ),
    require( 'rollup-plugin-node-resolve' )( {
      jsnext  : true,
      main    : true
    } )
  ]
}
