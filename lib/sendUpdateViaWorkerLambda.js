let AWS = require( "aws-sdk" );
AWS.config.region = "eu-west-1";

const anyEnvButLive   = require( "./anyEnvButLive" );

const lambda = new AWS.Lambda();

module.exports = function sendUpdateViaWorkerLambda ( subscriber, cpsId, message ) {
	const params = {
		"FunctionName": "breakingNewsQueueWorker" + anyEnvButLive(),
		"InvocationType": "Event",
		"Payload": JSON.stringify({
			"subscriber": subscriber,
			"cpsId": cpsId,
			"message": message
		})
	};
	lambda.invoke(params, function(err, data) {
		if ( err ) {
			console.log( err );
		}
	});
}