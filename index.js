//const Azure = require('azure');
const MsRest = require('ms-rest-azure');
const config = require('./azconfig');
const ResourceManagementClient = require('azure-arm-resource').ResourceManagementClient;
var fs = require('fs');
var util = require('util');
var path = require('path');
var monitoring = require('azure-monitoring')
var SubscriptionManagementClient = require('azure-arm-resource').SubscriptionClient;


var resourceClient;
var subscriptionClient;
var resList;

//_________________CONFIG_______________________________________________
var clientId = config.loginConfig.clientId;
var domain  = config.loginConfig.domain;
var secret   = config.loginConfig.secret;
var subscriptionId  = config.loginConfig.subscriptionId;
var resourceGroupName = config.loginConfig.resourceGroupName;
var res = config.loginConfig.storageAccount ;
var deploymentName= 'saketClusterNodeApi';
var baseURI = config.baseURI;
//_________________CONFIG_______________________________________________


//________LOGIN SERVICE_________________________________________________
MsRest.loginWithServicePrincipalSecret(clientId, secret, domain, startExec );

function startExec(err, credentials) {
    if(err) return console.error(err)

    credentials.subscriptionId = subscriptionId;
    resourceClient = new ResourceManagementClient(credentials, subscriptionId);
    eventClient = monitoring.createEventsClient(credentials, baseURI);

    resourceClient.resources.listByResourceGroup(resourceGroupName, function(err, result, request, response){

        if(err) {return console.log()}
        resList = result;
        console.log('\n\n\t res ' + JSON.stringify(result, 0,4) );
        fs.writeFileSync('./imb-gsl/resList.json', JSON.stringify(result, 0,4), 'utf-8');
        
    });

    var params = {};
    var MS_PER_MINUTE = 60000;
    var durationInMinutes = 12;
    var myStartDate = new Date(Date.now() - durationInMinutes * MS_PER_MINUTE);
    params.startTime = myStartDate;

    for(res in resList){
        params.resourceUri = res[id]

        eventClient.eventData.listEventsForResource(params, function(err, res){
            if(err) return console.log(err);
            console.log(res)
            fs.writeFileSync('./eventLog2.json', JSON.stringify(res, 0,4), 'utf-8');
        });
    }
    eventClient.eventData.listEvents(params , function(err, res){
        if(err) return console.log(err);
        console.log(res)
        fs.writeFileSync('./eventLog2.json', JSON.stringify(res, 0,4), 'utf-8');
    }) 
}

function getResourceLogs(){
    resourceClient.resourceGroups.list(callback);
}

