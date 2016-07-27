var pugLexer  = require( 'pug-lexer' )
var pugParser = require( 'pug-parser' )
var html      = require( 'common-tags' ).html

function attrs_to_hash( attrs ){
  var hash = {}

  for( var i = 0; i < attrs.length; i++ )
    hash[attrs[i].name] = attrs[i].val

  return hash
}

function pug_to_vdom( node ){
  if( node.type == 'Block' )
    return node.nodes.map( pug_to_vdom )

  if( node.type == 'Tag' )
    return  {
      tag      : node.name,
      attrs    : attrs_to_hash( node.attrs ),
      children : node.block.nodes.map( pug_to_vdom )
    }

  return node.val || ''
}

module.exports = function emjay(){
  var vdom = pug_to_vdom( pugParser( pugLexer( html.apply( this, arguments ) ) ) )

  if( 'length' in vdom && vdom.length === 1 )
    return vdom[ 0 ]

  else
    return vdom
}
