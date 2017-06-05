const fs              = require( "fs" );
const archiver        = require( "archiver" );
const request         = require( "request" );
const path            = require( "path" );
const fse             = require( "fs-extra" );
const cmd             = require( "node-cmd" );
const commandLineArgs = require( "command-line-args" );
const _               = require( "lodash" );
const glob            = require('glob-fs')({ gitignore: true });

let options = getCliOptions();

var projectConfigFileName;

addOptionsToEnvVars( options );

function getCliOptions() {

    var optionDefinitions = [
        { "name": "aws_profile", "type": String },
        { "name": "use_bastion", "type": Boolean, "defaultValue": false },
        { "name": "lambda_name", "type": String,  "defaultValue": null },
        { "name": "event",       "type": String },
        { "name": "local",       "type": Boolean, "defaultValue": false },
        { "name": "start_time",  "type": String },
        { "name": "search",      "type": String },
        { "name": "tail",        "type": Boolean, "default": false },
        { "name": "group_name",  "type": String },
        { "name": "env",         "type": String,  "defaultValue": "live" },
        { "name": "var_name",    "type": String },
        { "name": "var_value",   "type": String }
    ];
    
    const cliOptions       = commandLineArgs( optionDefinitions );
    projectConfigFileName  = chooseProjectFile( listEnvFiles(), cliOptions.env );
    const optionsOverrided = getConfigOptions( cliOptions );

    return optionsOverrided;

}

function getConfigOptions( options ) {
    const projectConfig = getProjectConfig();
    if ( projectConfig.useBastion ) {
        options.use_bastion = true;
    }
    if ( projectConfig.awsProfile ) {
        options.aws_profile = projectConfig.awsProfile;
    }
    return options;
}

function getProjectConfig() {
    return require( getProjectConfigFilePath() );
}

function getProjectConfigFilePath () {
    return `${process.cwd()}/${ projectConfigFileName }`;
}

function chooseProjectFile( envFiles, env ) {
    if ( env in envFiles ) {
        return envFiles[ env ];
    } else {
        throw new Error("`--env` parameter value has no matching collie file");
    }
}

function addOptionsToEnvVars( options ) {
    process.env.LAMBDA_NAME  = options.lambda_name;
    process.env.LAMBDA_EVENT = options.event;
    process.env.RUN_LAMBDA_LOCAL = options.local;
    if ( options.var_name ) {
        process.env.VAR_NAME = options.var_name;
    }
    if ( options.var_value ) {
        process.env.VAR_VALUE = options.var_value;
    }
    process.env.ENV = options.env;
}

function setRegion( AWS ) {
    const projectConfig = getProjectConfig();
    AWS.config.region = projectConfig.region;
}

function getOptions() {
    return options;
}

function listEnvFiles() {
    let files = glob.readdirSync( "collie*.json" );
    let envFiles = {};
    files.forEach( ( file ) => {
        
        const fileNameParts = file.split(".");
        let envName;
        
        if ( file === "collie.json" ) {
            envName = "live";
        }
        
        if ( fileNameParts.length > 2 ) {
            envName = fileNameParts[ 1 ];
        }

        envFiles[ envName ] = file;

    });
    return envFiles;
}

function authenticate() {

    return new Promise( ( resolve, reject ) => {

        if ( options.use_bastion ) {

            console.log( "Authenticating via bastion servers..." );

            authenticateAgainstBastionService()
                .then( resolve );
            return;

        }

        if ( options.aws_profile ) {

            console.log( "Authenticating via local AWS profile..." );

            process.env.AWS_PROFILE = options.aws_profile;
            resolve();
            return;

        }

        reject( "No login credentials supplied" );

    });

}

function authenticateAgainstBastionService() {

    return new Promise( ( resolve, reject ) => {

        const projectConfig = getProjectConfig();
        const certPath = path.resolve( projectConfig.bastionService.certPath );
        const requestOptions = {
            url: projectConfig.bastionService.endpoint,
            agentOptions: {
                cert: fs.readFileSync( certPath ),
                key:  fs.readFileSync( certPath ),
                ca:   fs.readFileSync( projectConfig.bastionService.cloudServicesRoot )
            }
        };

        request.get( requestOptions, function ( error, response, body ) {

            if ( error || ( response && response.statusCode !== 200 ) ) {
            
                const statusCode = ( response && response.statusCode ) ? response.statusCode : 'no code';
                const errorMessage = `Unable to authenticate to AWS using the wormhole (Code: ${statusCode})`;

                reject( errorMessage );
            
            } else {
            
                const credentials = JSON.parse(body);

                process.env.AWS_ACCESS_KEY_ID     = credentials.accessKeyId;
                process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey;
                process.env.AWS_SESSION_TOKEN     = credentials.sessionToken;

                resolve();

            }

        });

    });

}

function copy( src, dest ) {

    return new Promise( ( resolve, reject ) => {

        console.log( "Copying " + src + " to " + dest );

        fse.copy( src, dest, ( err ) => {
            if ( err ) {
                reject ( err );
            } else {
                resolve();
            }
        });

    });

}

function copyAllFilesInTmpDir() {
    return new Promise( ( resolve, reject ) => {
        fse.remove( "./tmp", ( err ) => {

            fse.ensureDir( "./tmp", ( err ) => {

                const config = getLambdaConfigFile();

                const stuffToCopy = [
                    "node_modules",
                    "package.json"
                ].concat( config.userDefinedCodeToDeploy );

                Promise.all(
                    stuffToCopy.map( ( item ) => copy( `./${item}`, `./tmp/${item}` ) )
                )
                    .then( resolve )
                    .catch( reject );

            });

        });

    });
}

function pruneNpmModules() {

    return new Promise( ( resolve, reject ) => {

        console.log( "Pruning the node_modules..." );

        cmd.get( "cd tmp && npm prune --production && npm list", ( stdout ) => {

            console.log( stdout );

            resolve();

        });

    });
}

function zipFiles() {

    return new Promise( ( resolve, reject ) => {

        console.log( "Creating the zip file..." );

        const zipFilePath = `./tmp/bot${Date.now()}.zip`

        var output = fs.createWriteStream( zipFilePath );
        var archive = archiver( "zip", {
            "store": true 
        });
     
        output.on( "close", () => {
            console.log( `Upload size: ${formatBytes( archive.pointer() )} / 50 MB (max)` );
            resolve( zipFilePath )
        });
     
        archive.on( "error", ( err ) => {
            console.log( "Deploy didn't work :-(" );
            reject( err );
        });
     
        archive.pipe( output );
     
        const config = getLambdaConfigFile();

        const stuffToZip = [
            "node_modules"
        ].concat( config.userDefinedCodeToDeploy );

        stuffToZip.forEach( ( item ) => {
            console.log( `adding ${item}` );
            if ( fs.lstatSync( item ).isDirectory() ) {
                archive.directory( `./tmp/${item}`, item )
            } else {
                archive.file( `${__dirname}/../tmp/${item}`, { name: item } );
            }
        });

        archive.finalize();

    });

}

function formatBytes(bytes,decimals) {
   if(bytes == 0) return '0 Bytes';
   var k = 1000,
       dm = decimals + 1 || 3,
       sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
       i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function lastItemInArray ( item, arr ) {
    return _.last( arr ) === item;
}

function addValueToLambdaConfig ( DotDelimitedProperty, value ) {

    let config = getLambdaConfigFile( process.env.LAMBDA_NAME );

    const propertyChain = DotDelimitedProperty.split( "." );

    let referencedPropertyToEdit = config;

    propertyChain.forEach( ( property, i, a ) => {
        
        if ( !( property in referencedPropertyToEdit ) ) {
            referencedPropertyToEdit[ property ] = {};
        }
        
        if ( lastItemInArray( property, propertyChain ) ) {
            referencedPropertyToEdit[ property ] = value;
        } else {
            referencedPropertyToEdit = referencedPropertyToEdit[ property ];
        }

    });

    fs.writeFileSync( getLambdaConfigFilePath( process.env.LAMBDA_NAME ), JSON.stringify( config, null, " " ) );

}

function addEnvVarToProjectConfig ( name, value ) {

    let projectConfig = getProjectConfig();
    projectConfig.environmentVariables[ name ] = value;
    fs.writeFileSync( getProjectConfigFilePath(), JSON.stringify( projectConfig, null, " " ) );

}

function getLambdaConfigFile() {

    return JSON.parse( fs.readFileSync( getLambdaConfigFilePath() ) );

}

function getLambdaConfigFilePath() {

    return `${process.cwd()}/${process.env.LAMBDA_NAME}/function.json`;

}

function getLambdaFilePath() {

    const config = getLambdaConfigFile( process.env.LAMBDA_NAME );

    const relativePathToLambdaFile = config.handler.split( "." ).slice( 0, -1 ).join( "." ) + ".js";

    return `${process.cwd()}/${relativePathToLambdaFile}`;

}

function everythingBeforeTheLastDot( dotDelimitedString ) {
    return dotDelimitedString.split(".").pop();
}

function getLambdaHandlerName () {

    const config = getLambdaConfigFile( process.env.LAMBDA_NAME );

    return everythingBeforeTheLastDot( config.handler );

}

function anyEnvButLive () {
    return ( process.env.ENV !== "live" ) ? process.env.ENV.toUpperCase() : "";
}

function getLambdaName () {

    const lambdaConfig = getLambdaConfigFile();

    const appendedToName = anyEnvButLive();

    return lambdaConfig.name + appendedToName;

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

        const projectConfig = getProjectConfig();

        addLambdaEnvironmentVariablesToProcess( projectConfig.environmentVariables );

        resolve();

    });

}

module.exports = {
    "addEnvVarToProjectConfig": addEnvVarToProjectConfig,
    "addValueToLambdaConfig": addValueToLambdaConfig,
    "authenticate": authenticate,
    "copyAllFilesInTmpDir": copyAllFilesInTmpDir,
    "createFakeRunTimeRequirements": createFakeRunTimeRequirements,
    "getOptions": getOptions,
    "getProjectConfig": getProjectConfig,
    "getProjectConfigFilePath": getProjectConfigFilePath,
    "getLambdaConfigFile": getLambdaConfigFile,
    "getLambdaConfigFilePath": getLambdaConfigFilePath,
    "getLambdaFilePath": getLambdaFilePath,
    "getLambdaHandlerName": getLambdaHandlerName,
    "getLambdaName": getLambdaName,
    "pruneNpmModules": pruneNpmModules,
    "setRegion": setRegion,
    "zipFiles": zipFiles
}