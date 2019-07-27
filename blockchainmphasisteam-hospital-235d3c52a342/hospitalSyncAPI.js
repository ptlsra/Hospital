console.log("Quorum API for Group Insurance");

/**
 * @file    HospitalAPI version 0.1
 * @file    API runs at http://localhost:5002
 * @file    API for hospital to invoke and query smart contract. This api works with only quorum blockchain. Platform will be expanded later. :)
 */

// required modules
var fs = require("fs");
var Web3 = require('web3-quorum');
var cors = require('cors');
var xhr = require('request');
var PDFDocument = require('pdfkit');

//mongod for local storage
// NOTE: install mongodb@2.2.33 
// do --> npm install mongodb@2.2.33 --save

var MongoClient = require('mongodb').MongoClient;
const abiDecoder = require('abi-decoder');
const express = require('express');

// md5 for generating hash
var md5 = require('md5');
const app = express();

// express file upload library
const fileUpload = require('express-fileupload');

var bodyParser = require('body-parser');
app.use(bodyParser.json());

// setting cors option for app
app.use(cors());
app.use(fileUpload());
app.options("*",cors());

// ipfs javascript http-client library
var ipfsAPI = require('ipfs-api');

//ipfs connection
var ipfs = ipfsAPI('/ip4/13.56.107.236/tcp/5001');
console.log("Starting API ");

// connecting to web3 provider
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:22001"));
var appPort=5000;


var policyContractAddress         = "0x9eb8d7e5bc8b742c5984655a352417b4af5c8579";
var hospitalContractAddress       = "0x6e59372e7267648d830a1d0843951a8c347963e1";
var insuranceContractAddress      = "0xbc8946145b67c12ecc76d5885dd20d28e53482c6";
var claimContractAddress          = "0x0cc912232a8dd54dadfc2c61d9a634da93fe9ada";








//read contract addresses from contractsConfig.json
let rawdata = fs.readFileSync('../contractConfig.json');  
let contractsData = JSON.parse(rawdata);
console.log(JSON.stringify(contractsData));

policyContractAddress = contractsData.policyContract;
insuranceContractAddress = contractsData.insuranceContract;
claimContractAddress = contractsData.claimContract;
hospitalContractAddress = contractsData.hospitalContract;










//read abi

//policy.sol
var policyContractSource = fs.readFileSync("Policy.json");
var policyContract = JSON.parse(policyContractSource)["contracts"];
var policyabi = JSON.parse(policyContract["Policy.sol:Policy"].abi);
const deployedPolicyContract = web3.eth.contract(policyabi).at(String(policyContractAddress));


//insurance.sol
var insuranceContractSource = fs.readFileSync("Insurance.json");
var insuranceContract = JSON.parse(insuranceContractSource)["contracts"];
var insuranceabi = JSON.parse(insuranceContract["Insurance.sol:Insurance"].abi);
const deployedInsuranceContract = web3.eth.contract(insuranceabi).at(String(insuranceContractAddress));

//Hospital.sol
var hospitalContractSource = fs.readFileSync("Hospital.json");
var hospitalContract = JSON.parse(hospitalContractSource)["contracts"];
var hospitalabi = JSON.parse(hospitalContract["Hospital.sol:Hospital"].abi);
const deployedHospitalContract = web3.eth.contract(hospitalabi).at(String(hospitalContractAddress));

//ClaimManagement.sol
var claimContractSource = fs.readFileSync("ClaimManagement.json");
var claimContract = JSON.parse(claimContractSource)["contracts"];
var claimabi = JSON.parse(claimContract["ClaimManagement.sol:ClaimManagement"].abi);
const deployedClaimContract = web3.eth.contract(claimabi).at(String(claimContractAddress));


//hospital wallet address;
let configRawData = fs.readFileSync('./config.json');  
let config = JSON.parse(configRawData);


//var hospitalAddress = "0x0638e1574728b6d862dd5d3a3e0942c3be47d996";
var hospitalAddress = config.hospitalWalletAddress;
var hospitalName    = config.hospitalName;

// mongodb url for api's

var mongoUrl = "mongodb://127.0.0.1:27017/";

var claimListDBUrl = "mongodb://localhost:27017/claimlist_db";
var claimListDB;



MongoClient.connect(claimListDBUrl, function(err, claimListDBTemp) {
    claimListDB = claimListDBTemp;
});





function syncAllClaims(){
    var claimListObject = deployedClaimContract['getClaimList']();
    var claimList=[];
    for(var index = 0; index < claimListObject.length; index++){
        var claimId = claimListObject[index];
        var initialClaimObject = deployedClaimContract['getInitialClaimDetails'](claimId);
        console.log("printing initial claim details : "+initialClaimObject);
        var patientDetailsObject = deployedHospitalContract['getPatientDetails'](initialClaimObject[0]);
        var patientName = patientDetailsObject[2];
        var claimDetailsObject = deployedClaimContract['getClaimDetails'](claimId);
        var approverName =web3.toUtf8(deployedInsuranceContract['getCompanyName'](initialClaimObject[6]));
        var initialClaimDetails = {
            claimId:claimId.toNumber(),
            claimStatus:web3.toUtf8(claimDetailsObject[0]),
            patientAddress:initialClaimObject[0],
            patientName:patientName,
            policyId:initialClaimObject[1].toNumber(),
            timestamp:initialClaimObject[2].toNumber(),
            claimEstimate:initialClaimObject[3].toNumber(),
            estimateDocument:web3.toUtf8(initialClaimObject[4])+web3.toUtf8(initialClaimObject[5]),
            initiallyApprovedBy:initialClaimObject[6],
            approverName:approverName,
        }
        var query = {claimId:claimId.toNumber()};
        var obj = initialClaimDetails;
        claimListDB.collection("claimlist").update(query,obj,{upsert: true}, function(err,doc){
                  if (err) throw err;
                  console.log("Record inserted/updated ..");
        });
    }
}

setInterval(function(){
    console.log("*********************** starting claimList Sync Function **************************");
    syncAllClaims();
},10000);
