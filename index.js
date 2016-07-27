var pugLexer  = require( 'pug-lexer' )
var pugParser = require( 'pug-parser' )
var html      = require( 'common-tags' ).html

function attrs_to_hash( attrs, transformer ){
  var hash = {}

  for( var i = 0; i < attrs.length; i++ )
    hash[ transformer( attrs[i].name ) ] = transformer( attrs[i].val )

  return hash
}

module.exports = function emjay(){
  // Dynamic values (as opposed to strings)
  var interpolations = Array.prototype.slice.call( arguments, 1 )
  // Strings to stand in as symbols for dynamic values
  var placeholders   = interpolations.map( function( interpolation, index ){
    return 'emjay' + index
  } )
  // The pug template, with placeholders indicating interpolated content
  var pug_template   = html.apply( this, [ arguments[ 0 ] ].concat( placeholders ) )

  // Substitutes placeholders with corresponding interpolations
  function hydrate( entity ){
    if( typeof entity === 'string' ){
      if( /^emjay\d+$/.test( entity ) )
        return interpolations[ entity.substr( 5 ) ]

      else
        return entity.replace( /emjay(\d+)/g, function( placeholder, index ){
          return interpolations[ index ]
        } )
    }

    return entity
  }

  // Transform pug AST into Mithril v0-flavoured virtual DOM, hydrating as we go along
  var vdom  = ( function pug_to_vdom( node ){
    if( node.type == 'Block' )
      return node.nodes.map( pug_to_vdom )

    else if( node.type == 'Tag' ){
      if( /^emjay\d+$/.test( node.name ) )
        return hydrate( node.name )

      else
        return {
          tag      : hydrate( node.name ),
          attrs    : attrs_to_hash( node.attrs, hydrate ),
          children : node.block.nodes.map( pug_to_vdom )
        }
    }

    else
      return hydrate( node.val ) || ''
  } )(
    pugParser( pugLexer( pug_template ) )
  )

  // Pug always produces an array, but Mithril v0 lower-order components must produce a single DOM root
  if( 'length' in vdom && vdom.length === 1 )
    return vdom[ 0 ]

  else
    return vdom
}
