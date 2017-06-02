const queueConsumer = require( "../lib/queueConsumer" );

exports.handler = function ( event, context, callback ) {

	queueConsumer.init( event, context.done );

}