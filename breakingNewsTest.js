const fs = require('fs');
let AWS = require( "aws-sdk" );

const utils = require( "./scripts/utils" );

const getDbCreds = require( "./lib/getDbCreds" );
const mysql = require( "mysql" );

AWS.config.region = "eu-west-1";

const cpsId = "news/uk-39355940";
let version = 1;
const updateCadence = 10000;
const lambda = new AWS.Lambda();

function prepData () {

	return new Promise( ( resolve ) => {

		getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const query = "DELETE FROM breakingNewsStoryContentSentToUser";
		        
		        connection.query( query, function ( error, results, fields ) {

		            if ( error ) {
		                console.log( error );
		            } else {
		            	console.log( results );
		            }

		            resolve();

		        });

		        connection.end();

		    });

    });

}

function cpsFixtureExists ( version ) {
	return fs.existsSync( `./tests/fixtures/cpsAssets/${cpsId}.v${version}.json` );
}

function getCpsFixture () {
	return new Promise( ( resolve ) => {

		resolve( fs.readFileSync( `./tests/fixtures/cpsAssets/${cpsId}.v${version}.json` ) );

	});
}

function sendToFakeCps ( fakeCpsAsset ) {

	return new Promise( ( resolve, reject ) => {

		const s3bucket = new AWS.S3({
	        "params": {
	            "Bucket": "bot-experiments"
	        }
	    });

		const params = {
	        "Key": `breaking-news/fake-cps/${cpsId}`,
	        "Body": fakeCpsAsset,
	        "ContentType": "application/json",
	        "ACL": "public-read"
	    };

	    s3bucket.upload( params, function( err, data ) {

	        if ( err ) {
	        	console.log( err );
	            reject( err );
	        } else {
	        	console.log( data );
	        	console.log( `/breaking-news/fake-cps/${cpsId}` );
		        resolve();
		    }

	    });

	});

}

function publishUpdateNotification () {

	return new Promise( ( resolve, reject ) => {

		const fakeSnsPayload = {
			"Records": [{
				"Sns": {
					"Type" : "Notification",
					"MessageId" : "7f42dfd8-46de-5f6e-9f68-8ea9364ace0d",
					"TopicArn" : "arn:aws:sns:eu-west-1:303748928824:live-publisher-notifications",
					"Message" : "{ \"last_published\":\"2017-03-31T11:29:09+00:00\", \"excluded_platforms\":[], \"event_type\":\"PUBLISH\", \"asset_type\":\"STY\", \"queue_id\":\"0\", \"write_time\":1490959750, \"curie\":\"https://api.live.bbc.co.uk/content/curie/asset:82a3376f-3257-7141-9bfd-9b32e9069078\", \"change_type\":\"minor change\", \"site_name\":\"/newsround\", \"uri\":\"https://api.live.bbc.co.uk/content/asset/news/uk-39355940\", \"publisher\":\"CORE_PUBLISHER\"}",
					"Timestamp" : "2017-04-19T14:04:04.252Z",
					"SignatureVersion" : "1",
					"Signature" : "DmgxFrhADeiV/0AiLkz9Ad3u4EfGBkckd7YDMBI0H2n13vbrOIXvC7zWOtUdGGqtwiJzHErJIcTykOBUoJH4xY3J7vqp/ftXEGiBePZp91aGSMinNxebYBek6GzjGR4runDCIRvmBAkQ8qwswmQEAkZ3Anz8p+mNRC8bJKD2IzCg9X7oo0FXJBgNn/zWP4kesST3B7hLXCgc5UTgcsfaLBfO4vm3AD7paCmtbMzfjNmqwv6/Ji2NWlEbRmZQ7JBwrZ7SU6ZPjlHm9r9z59B5sBdUI9G9D7LsHv5eI+FUTLCE3ecH+g+rr+14+2M071wsd8MUqQ1bLvxgzybgV0IefQ==",
					"SigningCertURL" : "https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-b95095beb82e8f6a046b3aafc7f4149a.pem",
					"UnsubscribeURL" : "https://sns.eu-west-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-1:303748928824:live-publisher-notifications:de0836cc-ee81-475a-84ce-9290a77cb8ba"
				}
			}]
		};

		const params = {
			"FunctionName": "breakingNewsQueueConsumer",
			"InvocationType": "Event",
			"Payload": JSON.stringify( fakeSnsPayload )
		};

		lambda.invoke(params, function(err, data) {
			if ( err ) {

				reject( err )

			} else {

				resolve( data );

			}
		});

	});

}

function queueNextUpdate () {
	if( cpsFixtureExists( version+1 ) ) {
		version++;
		setTimeout( () => {
			sendUpdate();
		}, updateCadence );
	}
}

function sendUpdate () {

	if ( cpsFixtureExists( version ) ) {

		getCpsFixture()
			.then( sendToFakeCps )
			.then( publishUpdateNotification )
			.then( queueNextUpdate )
			.catch( console.log );

	}

}

utils.authenticate()
	.then( prepData )
	.then( sendUpdate );