const fs = require( "fs" );
let AWS  = require( "aws-sdk" );
AWS.config.region = "eu-west-1";

const utils = require( "./utils" );

function getLambdaEventFile () {

	const path = `${process.cwd()}/${process.env.LAMBDA_EVENT}`;

	if ( fs.existsSync( path ) ) {
    	return JSON.parse( fs.readFileSync( path, "utf8" ) );
    } else {
    	return {};
    }

}

function addLambdaEnvironmentVariablesToProcess ( environmentVariables ) {
	if ( environmentVariables ) {
		Object.keys( environmentVariables ).forEach( ( key ) => {
			process.env[ key ] = environmentVariables[ key ];
		});
	}
}

function createFakeRunTimeRequirements () {

	return new Promise( ( resolve ) => {

		const projectConfig = utils.getProjectConfig();

		addLambdaEnvironmentVariablesToProcess( projectConfig.environmentVariables );

		resolve();

	});

}

function getLambdaHandler() {
	try {
		return require( utils.getLambdaFilePath() )[ utils.getLambdaHandlerName() ];
	}
	catch( err ) {
		console.log( "Error: Cannot find the lambda you are trying to run. Check the `--lambda_name` or the handler property in the lambda's function file.");
		throw err;
	}
}

function runLocalLamda() {

	return new Promise( ( resolve, reject ) => {

		createFakeRunTimeRequirements().then( () => {

			const config = utils.getLambdaConfigFile();

			const lambdaHandler = getLambdaHandler();

			lambdaHandler(
				getLambdaEventFile(),
				{
					"done": () => {}
				},
				function callback( err, data ) {
					if ( err ) {
						reject( err );
					}
					console.log( data );
					resolve();
				}
			);

		});

	});

}

function runningLocally() {
	return JSON.parse( process.env.RUN_LAMBDA_LOCAL );
}

function runLambda ( event ) {

	return new Promise( ( resolve, reject ) => {

		if ( runningLocally() ) {
			runLocalLamda().catch( reject );
		} else {
			runDeployedLamda();
		}
		resolve();

	});

}

function runDeployedLamda () {
	
	const config = utils.getLambdaConfigFile();
	const lambda = new AWS.Lambda();
	const params = {
		"FunctionName": config.name,
		"InvocationType": "RequestResponse",
		"Payload": JSON.stringify( getLambdaEventFile() ),
		"LogType": "Tail"
	};

	lambda.invoke(params, function(err, data) {
		if ( err ) {
			console.log( err );
		} else {
			if ( data.LogResult ) {
				console.log( "Status code: " + data.StatusCode );
				console.log( "Payload: " + data.Payload );
				console.log( Buffer.from( data.LogResult, "base64" ).toString() );
			}
			// console.log( data );
		}
	});

}

utils.authenticate()
	.then( createFakeRunTimeRequirements )
	.then( runLambda )
	.catch( console.log );