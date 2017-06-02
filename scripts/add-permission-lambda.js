let AWS  = require( "aws-sdk" );
AWS.config.region = "eu-west-1";

const utils = require( "./utils" );

function addOtherAccountsSnsAccessPermissionToLambda () {
	
	const params = {
		"Action": "lambda:InvokeFunction", 
		"FunctionName": "breakingNewsQueueConsumer", 
		"Principal": "sns.amazonaws.com", 
		"SourceAccount": "303748928824", 
		"SourceArn": "arn:aws:sns:eu-west-1:303748928824:live-publisher-notifications", 
		"StatementId": "Live-CPS-publisher-notifications"
	 };

	const lambda = new AWS.Lambda();
	
	lambda.addPermission(params, function (err, data) {
	  if (err) console.log(err, err.stack); // an error occurred
	  else     console.log(data);           // successful response
	});

}

function subscribeToSnsTopicFromOtherAccount () {

	var sns = new AWS.SNS();

	const params = {
		Protocol: 'lambda',
		TopicArn: 'arn:aws:sns:eu-west-1:303748928824:live-publisher-notifications',
		Endpoint: 'arn:aws:lambda:us-east-1:060170161162:function:SNS-X-Account'
	};

	sns.subscribe(params, function(err, data) {
		if (err) console.log(err, err.stack); // an error occurred
		else     console.log(data);           // successful response
	});

}

utils.authenticate()
	.then( addOtherAccountsSnsAccessPermissionToLambda )
	.then( subscribeToSnsTopicFromOtherAccount )
	.catch( console.log );