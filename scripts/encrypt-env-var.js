const AWS    = require( "aws-sdk" );
const prompt = require( "prompt" );

const utils = require( "./utils" );

const projectConfig = utils.getProjectConfig();

AWS.config.region = projectConfig.region;

function commandLineArgsAreValid () {

	return process.env.VAR_NAME && process.env.VAR_VALUE;

}

function encrypt ( resolve, reject ) {

	const varName = process.env.VAR_NAME;

	const varValue = process.env.VAR_VALUE;

	let kms = new AWS.KMS();

	const params = {
		"KeyId": projectConfig.kmsKeyArn,
		"Plaintext": varValue
	};

	kms.encrypt(params, function(err, data) {
		if (err) {
			reject( err );
		} else {
			utils.addEnvVarToProjectConfig( varName, data.CiphertextBlob.toString( "base64" ) );
			resolve();
		}
	});

}

function validateAndEnsure () {

	return new Promise( ( resolve, reject ) => {

		if ( commandLineArgsAreValid() ) {

			console.log( `You are about to set "${process.env.VAR_NAME}" to "${process.env.VAR_VALUE}" in the file "${utils.getProjectConfigFilePath()}"`)

			prompt.start();

			prompt.get([ { "message": "Are you sure you want to add this? (Y/n)" } ], ( err, results ) => {

				if ( !err && ( [ "y", "Y" ].indexOf( results.question ) > -1 ) ) {
					encrypt( resolve, reject );
				} else {
					if ( err ) {
						console.log( err );
					}
					reject( "Encryption rejected" );
				}

			});

		} else {
			reject( "ERROR: no variable name or variable value param defined. Please use the `--var_name` and `--var_value` options to state a var to encrypt" );
		}

	});

}

utils.authenticate()
	.then( validateAndEnsure )
	.catch( console.log );