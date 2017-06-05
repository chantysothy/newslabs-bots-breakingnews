const fs       = require( "fs" );
const AWS      = require( "aws-sdk" );

const utils    = require( "../utils" );

const projectConfig = utils.getProjectConfig();

AWS.config.region = projectConfig.region;

function configShouldBeUpdated( newConfig, projectConfig, deployedConfig ) {
    var shouldUpdate = false;
    if ( 
        ( newConfig.handler     !== deployedConfig.Handler     ) ||
        ( newConfig.memorySize  !== deployedConfig.MemorySize  ) ||
        ( newConfig.timeout     !== deployedConfig.Timeout     ) ||
        ( newConfig.runtime     !== deployedConfig.Runtime     ) ||
        ( newConfig.description !== deployedConfig.Description ) ||
        ( projectConfig.environmentVariables !== deployedConfig.Environment.Variables ) ||
        ( projectConfig.vpcConfig !== deployedConfig.VpcConfig )
    ) {
        shouldUpdate = true;
    }
    return shouldUpdate;
}

function deployToLambda( zipFilePath ) {

    console.log( "Deploying zip to Lambda..." );

    const config = utils.getLambdaConfigFile();

    var lambda = new AWS.Lambda();

    const params = {
        "FunctionName": utils.getLambdaName(), 
        "Publish": true,
        "ZipFile": fs.readFileSync( zipFilePath )
    };
    lambda.updateFunctionCode( params, ( err, deployedConfig ) => {
        if ( err ) {
            console.log(err, err.stack);
        } else {
            
            if ( configShouldBeUpdated( config, projectConfig, deployedConfig ) ) {
                
                console.log( "Updating configuration..." );

                const params = {
                    "FunctionName": utils.getLambdaName(),
                    "Description":  config.description,
                    "Environment": {
                        "Variables": projectConfig.environmentVariables
                    },
                    "Runtime":      config.runtime,
                    "Role":         config.roleArn,
                    "Handler":      config.handler,
                    "MemorySize":   config.memorySize,
                    "Timeout":      config.timeout
                };

                if ( projectConfig.vpcConfig ) {
                    params.VpcConfig = projectConfig.vpcConfig;
                }

                lambda.updateFunctionConfiguration( params, ( err ) => {

                    if ( err ) {
                        console.log( err );
                    } else {
                        console.log( "Config update complete." );
                    }
                })

            }
            console.log( "Code update complete." );
        }
    });

}

module.exports = function createLambda () {
    console.log( "Updating lambda..." );
    utils.copyAllFilesInTmpDir()
        .then( utils.pruneNpmModules )
        .then( utils.zipFiles )
        .then( deployToLambda )
        .catch( console.log );
};