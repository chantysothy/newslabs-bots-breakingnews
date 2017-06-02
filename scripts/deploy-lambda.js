const fs       = require( "fs" );
const AWS      = require( "aws-sdk" );

const utils        = require( "./utils" );
const updateLambda = require( "./lib/update-Lambda" );
const createLambda = require( "./lib/create-lambda" );

const projectConfig = utils.getProjectConfig();

AWS.config.region = projectConfig.region;

function isLambdaAlreadyDeployed( options ) {

	const lambda = new AWS.Lambda();

	const lambdaConfig = utils.getLambdaConfigFile();

	lambda.listFunctions({}, function( err, data ) {
	  if ( err ) {
	  	throw new Error( err );
	  } else {
	  	let match = false;
	  	data.Functions.forEach( ( func ) => {
	  		if ( func.FunctionName === lambdaConfig.name ) {
	  			match = true;
	  		}
	  	});
	  	if ( match ) {
	  		options.yes();
	  	} else {
	  		options.no();
	  	}
	  }
	});

}

function decideHowToDeployLambda () {

	isLambdaAlreadyDeployed({
		"yes": updateLambda,
		"no":  createLambda
	});

}

utils.authenticate()
	.then( decideHowToDeployLambda );

// lambda.getAccountSettings(params, function(err, data) {
//   if (err) console.log(err, err.stack); // an error occurred
//   else     console.log(data.AccountUsage.TotalCodeSize);           // successful response
// });