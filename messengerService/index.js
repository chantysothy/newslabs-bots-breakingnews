const messengerService  = require( "../lib/messengerService" );

exports.handler = function ( event, context, respondToMessenger ) {

    messengerService( event, context, respondToMessenger );

};