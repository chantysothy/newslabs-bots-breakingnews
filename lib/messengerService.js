const MessengerClient  = require( "../lib/messengerClient" );
const getSecrets       = require( "../lib/getSecrets" );
const subscribe        = require( "../lib/addSubscriber" );
const removeSubscriber = require( "../lib/removeSubscriber" );
const sendUpdateViaWorkerLambda = require( "../lib/sendUpdateViaWorkerLambda" );
const storeNewVersionOfContent  = require( "../lib/storeNewVersionOfContent" );

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

module.exports = function init ( event, context, respondToMessenger ) {

    getSecrets( "MESSENGER_PAGEACCESSTOKEN", "MESSENGER_VERIFYTOKEN" )
        .then ( ( messengerSecrets ) => {

            var messengerClient = new MessengerClient( {
                "pageAccessToken": messengerSecrets[ 0 ],
                "verifyToken":     messengerSecrets[ 1 ]
            } );

            const messageOptions = {
                "SUBSCRIBE": ( userId, payload ) => {
                    console.log( "subscribing" );
                    subscribe( userId, payload.cpsId, messengerClient )
                        .catch( console.log );
                },
                "UNSUBSCRIBE": ( userId, payload ) => {
                    console.log( "Unsubscribing" );
                    removeSubscriber( userId, payload.cpsId, messengerClient )
                        .catch( console.log );
                },
                "HELP": ( userId ) => {
                    sendHelp( messengerClient, userId );
                },
                "GET_STARTED": () => {
                    sendHelp( messengerClient, userId );
                }
            };

            messengerClient.on( "message", ( userId, message, payload, messageEvent) => {

                messengerClient.sendMessage({
                    "userId": userId,
                    "message": `automated reply to your message "${message}"`
                });

                if ( message.toUpperCase() === "HELP" ) {
                    payload = {
                        "type": "HELP"
                    }
                }

                messageOptions[ payload.type ]( userId, payload );

            });

            messengerClient.on( "postback", ( userId, payload, referral, messageEvent ) => {

                let msgObj = referral || payload;
                messageOptions[ msgObj.type ]( userId, msgObj );

            });

            messengerClient.init( event, context, respondToMessenger );

        })
        .catch( console.log );

};