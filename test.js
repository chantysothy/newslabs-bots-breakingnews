const mysql = require( "mysql" );
const _     = require( "lodash" );

const utils           = require( "./scripts/utils" );
const getDbCreds      = require( "./lib/getDbCreds" );
const getSecrets      = require( "./lib/getSecrets" );
const MessengerClient = require( "./lib/messengerClient" );

function setupGetStartedPage() {

	getSecrets( "messenger" )
        .then ( ( messengerSecrets ) => {

        	var messengerClient = new MessengerClient( messengerSecrets );

        	const command = { 
			    "get_started":{
			        "payload": '{\"type\":\"SUBSCRIBE\", \"cpsId\":\"news/uk-39355940\"}'
			    }
			};
			messengerClient._sendToFacebookAPI( command, { "messageType": "messengerProfile" } );
		});
}

function subscribe() {

	return new Promise( ( resolve ) => {

		const fakeMessengerEvent = {
			"context": {
				"http-method": "POST"
			},
			"params": {
				"querystring": {
					"hub.mode": "subscribe",
					"hub.verify_token": "brokenflowers2005",
					"hub.challenge": "howdy"
				}
			},
			"body-json": {
				"object": "page",
				"entry": [{
					"messaging": [{
						"sender": {
							"id": "1317577321651234"
						},
						"postback": {
							"payload": "{\"type\":\"SUBSCRIBE\",\"cpsId\":\"news/uk-39355940\"}"
						},
					}]
				}]
			}
		};

		require( "./messengerService" ).handler( 
				fakeMessengerEvent,
				{
					"done": () => {
						// call this to tell lambda you're finished
					}
				},
				function callback( err, data ) {
					// Pass data into here that will be returned to the Lambda callee.
					console.log( err );
					console.log( data );
					resolve();
				}
			);

	});

}

function unSubscribe() {

	return new Promise( ( resolve ) => {

		const fakeMessengerEvent = {
			"context": {
				"http-method": "POST"
			},
			"params": {
				"querystring": {
					"hub.mode": "subscribe",
					"hub.verify_token": "brokenflowers2005",
					"hub.challenge": "howdy"
				}
			},
			"body-json": {
				"object": "page",
				"entry": [{
					"messaging": [{
						"sender": {
							"id": "1317577321651234"
						},
						"postback": {
							"payload": "{\"type\":\"UNSUBSCRIBE\",\"cpsId\":\"news/uk-39355940\"}"
						},
					}]
				}]
			}
		};

		require( "./messengerService" ).handler( 
				fakeMessengerEvent,
				{
					"done": () => {
						// call this to tell lambda you're finished
					}
				},
				function callback( err, data ) {
					// Pass data into here that will be returned to the Lambda callee.
					console.log( err );
					console.log( data );
					resolve();
				}
			);

	});

}

function listUsers() {

	return new Promise( ( resolve ) => {

		getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const h = "SELECT * FROM usersFollowingBreakingNewsStories"

		        connection.query(h, function (error, results, fields) {

		            if (error) {
		                console.log( error );
		            } else {
		            	process.stdout.write(`\n\n| ${_.padEnd( '', 119, '-' )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( 'usersFollowingBreakingNewsStories', 119 )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( '', 119, '-' )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( 'cpsId', 0 )} | ${_.padEnd( 'userId', 16 )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( '', 100, '-' )} | ${_.padEnd( '', 16, '-' )} |\n`);
		                results.forEach( ( result ) => {
		                	process.stdout.write(`| ${_.padEnd( result.cpsId, 100 )} | ${_.padEnd( result.userId, 16 )} |\n`);
		                });
		            	process.stdout.write(`| ${_.padEnd( '', 119, '-' )} |\n`);

		            }
		            
		            resolve();

		        });

		        connection.end();

		    });

    });

}

function listStories() {

	return new Promise( ( resolve ) => {

		getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const h = "SELECT * FROM breakingNewsStoryContentSentToUser"

		        connection.query(h, function (error, results, fields) {

		            if (error) {
		                console.log( error );
		            } else {
		            	process.stdout.write(`\n\n| ${_.padEnd( '', 195, '-' )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( 'breakingNewsStoryContentSentToUser', 195 )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( '', 195, '-' )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( 'cpsId', 50 )} | ${_.padEnd( 'created', 39 )} | ${_.padEnd( 'content', 100 )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( '', 50, '-' )} | ${_.padEnd( '', 39, '-' )} | ${_.padEnd( '', 100, '-' )} |\n`);
		                results.forEach( ( result ) => {
		                	process.stdout.write(`| ${_.padEnd( result.cpsId, 50 )} | ${_.padEnd( result.created, 39 )} | ${_.padEnd( result.content, 100 )} |\n`);
		                });
		            	process.stdout.write(`| ${_.padEnd( '', 195, '-' )} |\n`);
		            }

		            resolve();

		        });

		        connection.end();

		    });

    });

}

function customQuery() {

	return new Promise( ( resolve ) => {

		getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const a = "CREATE TABLE usersFollowingBreakingNewsStories ( id VARCHAR(66) PRIMARY KEY, cpsId VARCHAR(50), userId VARCHAR(16) )";
		        const b = "CREATE TABLE breakingNewsStoryContentSentToUser ( cpsId VARCHAR(50) PRIMARY KEY, content JSON, created DATETIME )";
		        const c = "DROP TABLE usersFollowingBreakingNewsStories";
		        const d = "DROP TABLE breakingNewsStoryContentSentToUser";
		        const e = "INSERT INTO usersFollowingBreakingNewsStories VALUES ('news/uk-39355940', '789')";
		        const f = "INSERT INTO breakingNewsStoryContentSentToUser VALUES ('news/uk-39355940', '[]', '2017-03-22 14:45:00')";
		        const g = "UPDATE table SET credit = '+7' WHERE id='1'";
		        const h = "SELECT * FROM usersFollowingBreakingNewsStories JOIN breakingNewsStoryContentSentToUser on ( usersFollowingBreakingNewsStories.cpsId = breakingNewsStoryContentSentToUser.cpsId )"
		        const i = "DELETE FROM breakingNewsStoryContentSentToUser";

		        connection.query(i, function (error, results, fields) {

		            if (error) {
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

function askForHelp() {

	return new Promise( ( resolve ) => {

		const fakeMessengerEvent = {
			"context": {
				"http-method": "POST"
			},
			"params": {
				"querystring": {
					"hub.mode": "subscribe",
					"hub.verify_token": "brokenflowers2005",
					"hub.challenge": "howdy"
				}
			},
			"body-json": {
				"object": "page",
				"entry": [{
					"messaging": [{
						"sender": {
							"id": "1317577321651234"
						},
						"message": {
							"text": "help",
							"quick_reply": {
						    	"payload": "{\"type\":\"UNSUBSCRIBE\",\"cpsId\":\"news/uk-39355940\"}"
						    }
						}
					}]
				}]
			}
		};

		require( "./messengerService" ).handler( 
				fakeMessengerEvent,
				{
					"done": () => {
						// call this to tell lambda you're finished
					}
				},
				function callback( err, data ) {
					// Pass data into here that will be returned to the Lambda callee.
					console.log( err );
					console.log( data );
					resolve();
				}
			);

	});

}

function getMsgFromQueue () {

	return new Promise( ( resolve ) => {

		const fakeQueueMessage = {
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

		require( "./queueConsumer" ).handler(
			{
				"Records":[{
					"Sns": fakeQueueMessage,
				}]
			},
			{
				"done": () => {
					// call this to tell lambda you're finished
				}
			},
			function callback( err, data ) {
				// Pass data into here that will be returned to the Lambda callee.
				console.log( err );
				console.log( data );
				resolve();
			}
		);

	});
}

function processQueueWorker () {

	const fakeImagesMessage = {
		"subscriber": "1317577321651234",
		"message": {
			"content": [ { id: '95272337',
		       href: 'http://c.files.bbci.co.uk/11E6F/production/_95272337_floor_pa.jpg',
		       desc: 'Police surround suspected attacker' },
		     { id: '95273938',
		       href: 'http://c.files.bbci.co.uk/147E1/production/_95273938_westminster_shooting_earth_624_v2.png',
		       desc: 'Map' },
		     { id: '95272955',
		       href: 'http://c.files.bbci.co.uk/DA77/production/_95272955_aba_parliamentattack_05.jpg',
		       desc: 'Parliament went into lockdown after the attack' },
		     { id: '95272204',
		       href: 'http://c.files.bbci.co.uk/9D23/production/_95272204_bridge.jpg',
		       desc: 'Police on Westminster Bridge' },
		     { id: '95271224',
		       href: 'http://c.files.bbci.co.uk/A4E9/production/_95271224_parl_ap.jpg',
		       desc: 'Parliament' },
		     { id: '76020974',
		       href: 'http://news.bbcimg.co.uk/media/images/76020000/jpg/_76020974_line976.jpg',
		       desc: 'line' }
		    ],
			"type": "IMAGES"
		}
	};

	const fakeParagraphsMessage = {
		"subscriber": "1317577321651234",
		"cpsId": "news/uk-39355940",
		"message": {
			"content": [
				"BBC News - London attack: Two killed in Westminster \"terror\" incident",
				"Police officer is stabbed in Parliament and a women among several people struck by car on nearby bridge.",
				"The woman was among several pedestrians struck by a car on Westminster bridge, before it crashed into railings.",
				"An officer was stabbed in the Houses of Parliament by an attacker, who was shot by police.",
				"Police said there were \"a number of casualties\" and a \"full counter-terrorism inquiry\" was under way.",
				"Prime Minister Theresa May is to chair a meeting of the government's emergency Cobra committee later."
			],
			"type": "PARAGRAPHS"
		}
	}

	require( "./queueWorker" ).handler(
		fakeParagraphsMessage,
		{
			"done": () => {
				// call this to tell lambda you're finished
			}
		},
		function callback( err, data ) {
			// Pass data into here that will be returned to the Lambda callee.
			console.log( err );
			console.log( data );
		}
	);

}

utils.authenticate()
    // .then( setupGetStartedPage )
    // .then( customQuery )
    // .then( subscribe )
    // .then( unSubscribe )
    // .then( listUsers )
    // .then( askForHelp )
    // .then( getMsgFromQueue )
    .then( listStories )
    // .then( processQueueWorker )
    .catch( console.log );
