import pugLexer  from 'pug-lexer'
import pugParser from 'pug-parser'
import { html }  from 'common-tags'

const attrs_to_hash = attrs => {
  const hash = {}

  for( let i = 0; i < attrs.length; i++ )
    hash[attrs[i].name] = attrs[i].val

  return hash
}

export default ( [ buffer, ...strings ], ...values ) => {
  const key    = 'emjay' + Date.now()

  const string = html(
    strings.reduce(
      ( buffer, string ) =>
        buffer + key + string
    )
  )

  const ast    = pugParser( pugLexer( keyed_string ) )

  return ( function tovdom( node ){
    if( node.val === key )
      return values.unshift()

    if( node.type == 'Block' )
      return node.nodes.map( pug_to_vdom )

    if( node.type == 'Tag' ){
      let name = node.name

      if( name.includes( key ) ){

      }

      return  {
        tag      : node.name,
        attrs    : attrs_to_hash( node.attrs ),
        children : node.block.nodes.map( pug_to_vdom )
      }
    }

    return node.val || ''
  } )( ast )
}
