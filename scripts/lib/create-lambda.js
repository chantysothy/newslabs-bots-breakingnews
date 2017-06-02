var AWS                 = require( "aws-sdk" );
const fs                = require( "fs" );
const utils             = require( "../utils" );

const projectConfig = utils.getProjectConfig();

AWS.config.region = projectConfig.region;

function createLambda( zipFilePath ) {

    console.log( "Deploying zip to Lambda..." );

    const config = utils.getLambdaConfigFile();

    var lambda = new AWS.Lambda();

    var params = {
        "FunctionName": config.name,
        "Description": config.description,
        "Environment": {
            "Variables": config.environmentVariables
        },
        "Publish": true,
        "Code": {
            "ZipFile": fs.readFileSync( zipFilePath )
        },
        "Runtime":    config.runtime,
        "Role":       config.roleArn,
        "Handler":    config.handler,
        "MemorySize": config.memorySize,
        "Timeout":    config.timeout
    };

    lambda.createFunction( params, ( err, data ) => {
        if ( err ) {
            console.log(err, err.stack);
        } else {
            console.log( "lambda created" );
            utils.addValueToLambdaConfig( "lambdaArn", data.FunctionArn );
        }
    });

}

function createRoleForLambda() {

    return new Promise( ( resolve, reject ) => {

        const config = utils.getLambdaConfigFile();

        const roleName = `${config.name}Role`;

        if ( ( typeof config.roleArn === "string" ) && ( config.roleArn !== "" ) ) {
            console.log( `${roleName} already defined in the file "${utils.getLambdaConfigFilePath()}.`);
            resolve();
            return;
        }

        var iam = new AWS.IAM();


        iam.getRole({
            "RoleName": roleName
        }, function(err, data) {
            if ( err && ( err.code === "NoSuchEntity" ) ) {
            
                console.log( "Creating role..." );

                const params = {
                    "AssumeRolePolicyDocument": JSON.stringify( {
                        "Version": "2012-10-17",
                        "Statement": [{
                            "Effect": "Allow",
                            "Principal": { "Service": ["lambda.amazonaws.com"] },
                            "Action": ["sts:AssumeRole"]
                        }]
                    } ),
                    "Path": "/", 
                    "RoleName": roleName
                };
                iam.createRole(params, function(err, data) {
                    if ( err ) {
                        reject( err );
                    } else {
                        utils.addValueToLambdaConfig( "roleArn", data.Role.Arn );
                        iam.attachRolePolicy({
                            "RoleName": roleName,
                            "PolicyArn" : "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                        }, ( err ) => {
                            if ( !err ) {

                                if ( config.customRolePolicy ) {

                                    iam.attachRolePolicy({
                                        "RoleName": roleName,
                                        "PolicyArn" : config.customRolePolicy
                                    }, ( err ) => {
                                        if ( !err ) {

                                            setTimeout( () => {
                                                resolve()
                                            }, 1000 );

                                        } else {
                                            reject( err );
                                        }
                                    });

                                } else {
                                    resolve();
                                }

                            } else {
                                reject( err );
                            }
                        });
                    }
                });

            } else if ( err ) {

                reject( err );

            } else {

                console.log( roleName + " already exists in your AWS account.");
                utils.addValueToLambdaConfig( "roleArn", data.Role.Arn );
                resolve();

            }
        });

    });

}

module.exports = function init () {
    console.log( "creating lambda..." );
    createRoleForLambda()
        .then( utils.copyAllFilesInTmpDir )
        .then( utils.pruneNpmModules )
        .then( utils.zipFiles )
        .then( createLambda )
        .catch( console.log );
    
}