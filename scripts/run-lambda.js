const fs       = require( "fs" );
const AWS      = require( "aws-sdk" );

const utils    = require( "./utils" );

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

		resolve( getLambdaEventFile() );

	});

}

function runLambda ( event ) {

	return new Promise( ( resolve, reject ) => {

		const config = utils.getLambdaConfigFile();

		require( utils.getLambdaFilePath() )[ config.handler ]( 
			event,
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

}

utils.authenticate()
	.then( createFakeRunTimeRequirements )
	.then( runLambda )
	.catch( console.log )