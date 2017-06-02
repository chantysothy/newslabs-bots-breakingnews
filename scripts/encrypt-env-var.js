var AWS = require( "aws-sdk" );

const utils = require( "./utils" );

const projectConfig = utils.getProjectConfig();

AWS.config.region = projectConfig.region;

function commandLineArgsAreValid () {

	return process.env.VAR_NAME && process.env.VAR_VALUE;

}

function encrypt () {

	return new Promise( ( resolve, reject ) => {

		if ( commandLineArgsAreValid() ) {

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

		} else {
			reject( "ERROR: no variable name or value defined. Please use the `--var_name` and `--var_value` options to state a var to encrypt" );
		}

	});

}

utils.authenticate()
	.then( encrypt )
	.catch( console.log );