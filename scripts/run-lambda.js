const fs = require( "fs" );
let AWS  = require( "aws-sdk" );
AWS.config.region = "eu-west-1";

const utils = require( "./utils" );

function getLambdaEventFile () {

    return JSON.parse( fs.readFileSync( `${process.cwd()}/${process.env.LAMBDA_EVENT}`, "utf8" ) );

}

function addLambdaEnvironmentVariablesToProcess ( environmentVariables ) {
	if ( environmentVariables ) {
		Object.keys( environmentVariables ).forEach( ( key ) => {
			process.env[ key ] = environmentVariables[ key ];
		});
	}
}

function createFakeRunTimeRequirements () {

	return new Promise( ( resolve, reject ) => {

		const config = utils.getLambdaConfigFile();

		addLambdaEnvironmentVariablesToProcess( config.environmentVariables );

		resolve();

	});

}

function runLocalLamda() {

	return new Promise( ( resolve, reject ) => {

		createFakeRunTimeRequirements().then( () => {

			const config = utils.getLambdaConfigFile();

			require( utils.getLambdaFilePath() )[ config.handler ]( 
				getLambdaEventFile(),
				{
					"done": () => {
						// call this to tell lambda you're finished
					}
				},
				function callback( err, data ) {
					console.log( err );
					console.log( data );
					resolve();
				}
			);

		});

	});

}

function runningInTestMode() {
	return JSON.parse( process.env.RUN_LAMBDA_LOCAL );
}

function runLambda ( event ) {

	return new Promise( ( resolve ) => {

		if ( runningInTestMode() ) {
			runLocalLamda();
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
				console.log( Buffer.from( data.LogResult, "base64" ) );
			}
			console.log( data );
		}
	});

}

utils.authenticate()
	.then( createFakeRunTimeRequirements )
	.then( runLambda )
	.catch( console.log )