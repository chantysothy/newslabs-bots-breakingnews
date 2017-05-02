const MessengerClient  = require( "./lib/messengerClient" );
const getSecrets       = require( "./lib/getSecrets" );
const subscribe        = require( "./lib/addSubscriber" );
const removeSubscriber = require( "./lib/removeSubscriber" );

function sendHelp( messengerClient, userId ) {
    messengerClient.sendMessage({
        "userId": userId,
        "message": "Here are the things I can do:",
        "buttons": [{
            "text": "Subscribe",
            "payload": {
                "type": "SUBSCRIBE",
                "cpsId": "news/uk-39355940"
            }
        },{
            "text": "Unsubscribe",
            "payload": {
                "type": "UNSUBSCRIBE",
                "cpsId": "news/uk-39355940"
            }
        }]
    });
}

exports.handler = function ( event, context, respondToMessenger ) {

    getSecrets( "messenger" )
        .then ( ( messengerSecrets ) => {

            var messengerClient = new MessengerClient( messengerSecrets );

            const messageOptions = {
                "SUBSCRIBE": ( userId, payload ) => {
                    console.log( "subscribing" );
                    subscribe( userId, payload.cpsId, messengerClient )
                        // .then( sendUpdateToUser )
                        .catch( console.log );
                },
                "UNSUBSCRIBE": ( userId, payload ) => {
                    console.log( "Unsubscribing" );
                    removeSubscriber( userId, payload.cpsId, messengerClient )
                        .catch( console.log );
                },
                "HELP": ( userId ) => {
                    sendHelp( messengerClient, userId );
                }
            };

            messengerClient.on( "message", ( userId, message, payload, messageEvent) => {

                messengerClient.sendMessage({
                    "userId": userId,
                    "message": `automated reply to your message "${message}"`
                });

                messageOptions[ payload.type ]( userId, payload );

            });

            messengerClient.on( "postback", ( userId, payload, messageEvent ) => {

                messageOptions[ payload.type ]( userId, payload );

            });

            messengerClient.init( event, context, respondToMessenger );

        })
        .catch( console.log );

};