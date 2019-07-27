
// required modules
var fs = require("fs");
var Web3 = require('web3-quorum');
var cors = require('cors');
var PDFDocument = require('pdfkit');
// ipfs javascript http-client library
var ipfsAPI = require('ipfs-api');
var log4js = require('log4js');
var logger = log4js.getLogger('app.js');
var morganLogger = require('morgan');

//mongod for local storage
// NOTE: install mongodb@2.2.33 
// do --> npm install mongodb@2.2.33 --save
var MongoClient = require('mongodb').MongoClient;
const express = require('express');

const app = express();

// express file upload library
const fileUpload = require('express-fileupload');

var bodyParser = require('body-parser');
app.use(bodyParser.json());

// setting cors option for app
app.use(cors());
app.use(fileUpload());
app.use(morganLogger('dev'));
app.options("*", cors());

/**
 * UI integration
 */
var pathval=__dirname + "/UI/";
console.log(pathval);
app.set('views',pathval);
app.use(express.static(pathval));



let configRawData = fs.readFileSync('./config.json');
let config = JSON.parse(configRawData);

var hospitalAddress = config.hospitalWalletAddress;
var hospitalName = config.hospitalName;
var hospitalPort = config.serverPort;
var hospitalNodeIp = config.serverAddress;
var ipfsAddress = config.ipfsUrl;
var hospitalWalletPassword = config.hospitalWalletPassword;
var web3Url = config.web3Url;
var appPort = config.appPort;
var appIp = config.appIp;
var mongoIp = config.mongoIp;
var mongoPort = config.mongoPort;
var appIpAddress =  config.ipfsIp;
;
logger.level = config.logLevel;

//initialize ipfs
var ipfs = ipfsAPI(ipfsAddress);

// connecting to web3 provider
var web3 = new Web3(new Web3.providers.HttpProvider(web3Url));

//read contract addresses from contractsConfig.json
let rawdata = fs.readFileSync('./contractConfig.json');
let contractsData = JSON.parse(rawdata);
logger.debug(JSON.stringify(contractsData));

var policyContractAddress = contractsData.policyContract;
var insuranceContractAddress = contractsData.insuranceContract;
var claimContractAddress = contractsData.claimContract;
var hospitalContractAddress = contractsData.hospitalContract;




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


/**
 * 
 * Read config file
 */



//ipfs connection

//hospital wallet address;

//var hospitalAddress = "0x1f5dde3b5fb6518f589303e58467d974c1c41c53";
//var hospitalName    = "ABC";

// mongodb url for api's
var mongoUrl = "mongodb://" + mongoIp + ":" + mongoPort + "/";

//var claimListDBUrl = "mongodb://localhost:27017/claimlist_db";
var claimListDBUrl = mongoUrl + "hospital_claimlist_db";
var patientListDBUrl = "mongodb://localhost:27017/patientlist_db";


var claimListDB;
var patientListDB;


MongoClient.connect(claimListDBUrl, function (err, claimListDBTemp) {
    claimListDB = claimListDBTemp;
});


var patientListDBurl = mongoUrl + hospitalName;
var patientListDB;
MongoClient.connect(patientListDBurl, function (err, patientListDBTemp) {
    patientListDB = patientListDBTemp;
});


var hospitalUrl = mongoUrl + hospitalName;
var hospitalDB;
MongoClient.connect(hospitalUrl, function (err, hospitalTempDB) {
    hospitalDB = hospitalTempDB;
});

var hospitalTxnsDBurl = mongoUrl + hospitalName + "_txns";
var hospitalTxnsDB;
MongoClient.connect(hospitalTxnsDBurl, function (err, hospitalTxnsDBTemp) {
    hospitalTxnsDB = hospitalTxnsDBTemp;
});


/**
 * 
 * 
 * Hospital Events
 * 
 * 
 * 
 */


/**
 * patient registration event
 * @event
 */


var registerPatient;

registerPatient = deployedHospitalContract.RegisterPatient({}, { fromBlock: 'latest', toBlock: 'latest' });
registerPatient.watch(function (error, result) {
    logger.debug("******************  Register Patient Event *********************");
    logger.debug(result);
    logger.debug("printing arguments : " + result.args);
    var args = result.args;
    storeHospitalTransactions(args.patientName, args.policyId, result.transactionHash, args.description, "");
    logger.debug("transaction not sent to db");
});

/**
 * claim initiation event
 * @event
 * 
 */

var claimInit;

claimInit = deployedClaimContract.InitialClaimEvent({}, { fromBlock: 'latest', toBlock: 'latest' });
claimInit.watch(function (error, result) {
    logger.debug("******************  claim Init Event *********************");
    logger.debug(result);
    logger.debug("printing arguments : " + result.args);
    var args = result.args;
    //storeBrokerTransaction(hospitalName, result.transactionHash, args.description, "");


    //get patientAddress first
    var patientObject = deployedHospitalContract['getPatientDetails'](args.patientAddress);
    logger.debug("printing patientName:  " + patientObject[2]);

    storeHospitalTransactions(patientObject[2], args.policyId, result.transactionHash, args.description, args.claimId.toNumber());
    logger.debug("transaction sent to db");
    logger.debug("storing claim record to database");
    insertClaimRecord(result.args.claimId);
});

/**
 * 
 * upload claim document event
 * @event
 */

var claimDocumentEvent;

claimDocumentEvent = deployedClaimContract.UploadClaimDocument({}, { fromBlock: 'latest', toBlock: 'latest' });
claimDocumentEvent.watch(function (error, result) {
    logger.debug("******************  claim document upload event *********************");
    logger.debug(result);
    logger.debug("printing arguments : " + result.args);
    var args = result.args;

    //get patientAddress first
    var patientObject = deployedHospitalContract['getPatientDetails'](args.patientAddress);
    logger.debug("printing patientName:  " + patientObject[2]);

    //storeBrokerTransaction(hospitalName, result.transactionHash, args.description, "");
    storeHospitalTransactions(patientObject[2], args.policyId, result.transactionHash, args.description, args.claimId.toNumber());
    logger.debug("transaction sent to db");
});


/**
 * accept claim event
 * @event
 * 
 */



var acceptClaim;

acceptClaim = deployedClaimContract.InitialClaimApproval({}, { fromBlock: 'latest', toBlock: 'latest' });
acceptClaim.watch(function (error, result) {
    logger.debug("******************  Accept Claim Event *********************");
    logger.debug(result);
    logger.debug("printing arguments : " + result.args);
    var args = result.args;

    var patientObject = deployedHospitalContract['getPatientDetails'](args.patientAddress);
    logger.debug("printing patientName:  " + patientObject[2]);


    // storeBrokerTransaction("marsh", result.transactionHash, args.description, "");
    storeHospitalTransactions(patientObject[2], args.policyId, result.transactionHash, args.description, args.claimId.toNumber());
    logger.debug("transaction sent to db");
});


/**
 * FinalClaimApprove event
 * @event
 * 
 */

var finalClaimApproval;
finalClaimApproval = deployedClaimContract.FinalClaimApproval({}, { fromBlock: 'latest', toBlock: 'latest' });
finalClaimApproval.watch(function (error, result) {
    logger.debug("****************** Final Claim Approval Event *********************");
    logger.debug(result);
    logger.debug("printing arguments : " + result.args);
    var args = result.args;


    var patientObject = deployedHospitalContract['getPatientDetails'](args.patientAddress);
    logger.debug("printing patientName:  " + patientObject[2]);

    //storeBrokerTransaction("marsh", result.transactionHash, args.description, "");
    storeHospitalTransactions(patientObject[2], args.policyId, result.transactionHash, args.description, args.claimId.toNumber());
    logger.debug("transaction sent to db");
});


/**
 * Update claim status event
 * 
 */

var updateClaimStatus;
updateClaimStatus = deployedClaimContract.UpdateClaimStatus({}, { fromBlock: 'latest', toBlock: 'latest' });
updateClaimStatus.watch(function (error, result) {
    logger.info("updateClaimStatus");
    logger.debug("result : " + result);
    updateClaimRecord(result.args.claimId, result.args.claimStatus);
});


/**
 * UploadEstimateDocument
 * @event
 */
uploadEstimateDocument = deployedClaimContract.UploadEstimateDocument({}, { fromBlock: 'latest', toBlock: 'latest' });

uploadEstimateDocument.watch(function (error, result) {
    logger.info("uploadEstimateDocument");
    logger.debug("result : " + result);
    //new method to update claimlist_db
    //Just update estimateDocument key in the record
    //search the record by claimid
    updateEstimateDocument(result.args.claimId);
});


/**************************************** API Starts here *****************************************************/

/**
 * API to register/enroll   patient
 * 
 * @function                registerPatient
 * @param     {string}      patientName            - patient name
 * @param     {string}      dob                    - date of birth
 * @param     {string}      age                    - age of patient
 * @param     {gender}      gender                 - gender of patient
 * @param     {string}      policyId               - policyId of patient
 * @param     {string}      mobileNumber           - mobile number
 * @param     {string}      emailId                - emailId of patient
 * @returns   {JSONObject}  
 */


app.post('/registerPatient', function (request, response) {
    try {

        var patientName = request.query.patientName;
        var dob = request.query.dob;
        var age = request.query.age;
        var gender = request.query.gender;
        var policyId = request.query.policyId;
        var mobileNumber = request.query.mobileNumber;
        var emailId = request.query.emailId;
        var isError = false;

        if (isNaN(age)) {
            console.log(new Error("age is not a number"));
            isError = true;
        } else {
            if (isNaN(mobileNumber)) {
                console.log(new Error("mobileNumber is not a number"));
                isError = true;
            } else {
                if (mobileNumber.toString().length != 10) {
                    console.log(new Error("Invalid mobile number"));
                    isError = true;
                } else {
                    if (isNaN(policyId)) {
                        console.log(new Error("policyId is not a number"));
                        isError = true;
                    }
                }
            }
        }

        if (isError == false) {

            //save details to mongodb 
            logger.debug("********************* store customer details to database *******************");

            //create account for patient
            var walletResponse = web3.personal.newAccount("");
            var walletAddress = walletResponse;
            web3.personal.unlockAccount(walletAddress, "");
            web3.personal.unlockAccount(hospitalAddress, hospitalWalletPassword);

            //sending some ether to customer's wallet
            //web3.eth.sendTransaction({from:hospitalAddress, to:walletAddress, value:70000000000});
            logger.debug("************ connected to mongodb client at localhost *************");
            logger.debug("************ storing record **********");
            var unixTimeStamp = Math.round((new Date()).getTime() / 1000);
            //var myobj = {customerName: customerName, userName: userName, password: password, scheme: scheme, sumInsured, sumInsured, emailId: emailId, tenure, tenure, dobEldest, dobEldest };
            var myObj = { patientName: patientName, dob: dob, age: age, gender: gender, policyId: policyId, mobileNumber: mobileNumber, emailId: emailId, walletAddress: walletAddress, registrationTimeStamp: unixTimeStamp };
            var collectionName = patientName + policyId;
            hospitalDB.collection(collectionName).insertOne(myObj, function (err, res) {
                if (err) throw err;
                logger.debug("Customer record inserted ....");
            });

            let promiseA = new Promise((resolve, reject) => {
                let wait = setTimeout(() => {
                    //var jsonResponse = (deployedPolicyContract['registerCustomer'](walletAddress, customerName, userName, sumInsured, tenure,{ from:walletAddress, gas: 4000000}));
                    var jsonResponse = (deployedHospitalContract['registerPatient'](walletAddress, patientName, policyId, { from: hospitalAddress, gas: 4000000 }));
                    var message = {
                        "walletAddress": walletAddress,
                        "txId": jsonResponse
                    }
                    logger.debug("***************** Patient record created ************************");
                    response.setHeader('Content-Type', 'application/json');
                    response.send(message);
                }, 10000)
            });

        } else {
            response.send({
                "error": "Error in register patient"
            });
        }
    } catch (e) {
        logger.error(e);
    }

});


/**
 * API to get patientDetails
 * 
 * @function                    getPatientDetails
 * @param       {string}        patientAddress          -   walletAddress of the patient
 * @returns     {JSONObject}    patientDetils           -   returns patient details
 */

app.get('/getPatientDetails', function (request, response) {
    var patientAddress = request.query.patientAddress;
    logger.debug("************************ patient details ***********************");
    var patientObject = (deployedHospitalContract)['getPatientDetails'](patientAddress);

    var patientDetails = {
        patientAddress: patientObject[0],
        patientId: patientObject[1],
        patientName: patientObject[2],
        policyId: patientObject[3]
    }

    response.send(patientDetails);
});

/**
 * API to get patient details by patientName and policyId
 * 
 * @function                    getPatientInfo
 * @param       {string}        patientName
 * @param       {number}        policyNumber
 * 
 * @returns     {JSONObject}    patientInfo
 */

app.get('/getPatientInfo', function (request, response) {
    var patientName = request.query.patientName;
    var policyId = request.query.policyId;
    var userName = patientName + policyId;

    try {
        hospitalDB.collection(userName).find().toArray(function (err, patientObject) {
            if (err) {
                logger.debug("error");
                throw err;
            }
            logger.debug(patientObject);
            if (patientObject.length == 0) {
                jsonResponse = {
                    error: "failed to fetch data"
                }
                //response.send(jsonResponse);
            } else {
                var patientInfo = {
                    patientName: patientObject[0].patientName,
                    dob: patientObject[0].dob,
                    policyId: patientObject[0].policyId,
                    gender: patientObject[0].gender,
                    walletAddress: patientObject[0].walletAddress,
                    emailId: patientObject[0].emailId,
                    age: patientObject[0].age
                }
            }
            response.send(patientInfo);
        });
    } catch (Exception) {
        logger.debug("error in fetching data");
    }
});

/**
 * API to view policyDetails of the policy holder
 * 
 * @function                    getPolicyDetails
 * 
 * @param       {number}        policyId            -   policyId of the customer
 * @returns     {JSONObject}    policyDetails       -   policy details of the customer
 * 
 */
app.get('/getPolicyDetails', function (request, response) {
    var policyId = request.query.policyId;

    var policyObject = deployedPolicyContract['getPolicy'](policyId, hospitalAddress);
    logger.debug("printing policyObject : " + JSON.stringify(policyObject));

    //get dependent details
    var dependentsObject = deployedPolicyContract['getDependents'](policyId);

    logger.debug("printing dependents list : " + dependentsObject);
    logger.debug("converting all list objects to utf8 ");
    var dependentList = [];
    var dependentObject;

    for (var index = 0; index < dependentsObject[0].length; index++) {

        //get dependent details
        var dependentDetailsObject = deployedPolicyContract['getDependentDetails'](dependentsObject[1][index]);

        logger.debug("printing age : " + dependentDetailsObject[1]);
        logger.debug("printing gender : " + dependentDetailsObject[2]);

        dependentObject = {
            dependentName: web3.toUtf8(dependentsObject[0][index]),
            dependentId: dependentsObject[1][index],
            age: dependentDetailsObject[1],
            gender: web3.toUtf8(dependentDetailsObject[2]),
            relation: web3.toUtf8(dependentDetailsObject[3])
        }

        dependentList.push(dependentObject);
    }

    //get company name

    var policyProviderName = deployedInsuranceContract['getCompanyName'](policyObject[0]);

    logger.debug("policy provider name is : " + web3.toUtf8(policyProviderName));

    var policyDetailsObject = deployedPolicyContract['getPolicy'](policyId, "");

    var policyHolderAddress = policyDetailsObject[1];

    var policyHolderDetails = deployedPolicyContract['getCustomerDetails'](policyHolderAddress);

    var insuredAmount = policyHolderDetails[3];
    var policyHoldername = policyHolderDetails[1];

    var policyDetails = {
        policyId: policyId,
        policyHolderName: policyHoldername,
        policyProviderAddress: policyObject[0],
        policyProviderName: web3.toUtf8(policyProviderName),
        policyValidity: policyObject[2],
        policyDocumentHash: web3.toUtf8(policyObject[3]) + web3.toUtf8(policyObject[4]),
        timeStamp: policyObject[5],
        dependents: dependentList,
        sumInsured: insuredAmount
    }

    response.send(policyDetails);
});


/**
 * 
 * API to initiateClaim
 * @function                            initiateClaim
 * 
 * @param           {string}            patientAddress              - walletAddress of the patient
 * @param           {number}            policyId                    - policyId of the patient
 * @param           {fromAddress}       hospitalAddress             - wallet address of hospital
 * @param           {number}            claimEstimate               - initial claim estimate (money)
 * @param           {file}              estimateDocument            - pdf document containing prescription and estimate
 */
app.post('/initiateClaim', function (request, response) {

    try {
        var patientAddress = request.query.patientAddress;
        var policyId = request.query.policyId;
        var hospitalAddress = request.query.hospitalAddress;
        var claimEstimate = request.query.claimEstimate;

        var isError = false;
        if (isNaN(policyId)) {
            console.log(new Error("policyId is not a number"));
            isError = true;
        } else {
            if (isNaN(claimEstimate)) {
                console.log(new Error("claimEstimate is not a number"));
                isError = true;
            }
        }

        if (isError == false) {

            logger.debug("patientAddress : " + patientAddress);
            logger.debug("policyId : " + policyId);
            logger.debug("hospitalAddress : " + hospitalAddress);
            logger.debug("claimEstimate : " + claimEstimate);
            //get the document (prescription)

            web3.personal.unlockAccount(hospitalAddress, hospitalWalletPassword);
            logger.debug("customer account unlocked");

            // var transactionId = deployedPolicyContract['createPolicy'](marshAddress, customerAddress, policyValidity, documentHashFirstSlice, documentHashSecondSlice, insuranceContractAddress, insuranceAddress, tpaAddress,{from: String(customerAddress), gas: 4000000});
            var transactionId = deployedClaimContract['initiateClaim'](patientAddress, policyId, hospitalAddress, insuranceContractAddress, claimEstimate, { from: String(hospitalAddress), gas: 4000000 });

            //wait for 10 seconds for transaction to be mined

            let promiseA = new Promise((resolve, reject) => {
                let wait = setTimeout(() => {
                    //get claimId of the patient
                    var patientClaimsObject = deployedClaimContract['getPatientClaims'](patientAddress);
                    logger.debug("printing patient claims : " + JSON.stringify(patientClaimsObject));
                    var length = patientClaimsObject.length;
                    logger.debug("length is : " + length);

                    if (length == 0) {
                        var error = {
                            error: "error claim was not initiated. check whether marsh has set the policy owners for your policy. :)"
                        }
                        response.send(error);
                    }

                    var claimId = patientClaimsObject[length - 1];

                    //create estimateDocument
                    logger.debug("claimId is : " + claimId);



                    createClaimEstimateDocument(claimId, policyId, claimEstimate, patientAddress);
                    let promiseA = new Promise((resolve, reject) => {
                        let wait = setTimeout(() => {
                            fs.readFile('claims/claimEstimate_' + claimId + '.pdf', function (err, buf) {
                                logger.debug("contents : " + buf);
                                //upload document to ipfs
                                //prepare files array (contains name and file buffer of document)

                                const files = [
                                    {
                                        path: "claimEstimate_" + claimId + ".pdf",
                                        content: buf
                                    },
                                ]
                                ipfs.files.add(files, (err, filesAdded) => {

                                    logger.debug(filesAdded);
                                    logger.debug("printing policyDocument hash : " + filesAdded[0].hash);
                                    var claimDocHash = filesAdded[0].hash;

                                    var documentHashFirstSlice = claimDocHash.slice(0, 26);
                                    var documentHashSecondSlice = claimDocHash.slice(26, claimDocHash.length);

                                    logger.debug("hash first slice " + documentHashFirstSlice);
                                    logger.debug("hash second sclice " + documentHashSecondSlice);

                                    //uploading policy document
                                    var uploadTxid = deployedClaimContract['uploadEstimateDocument'](claimId, documentHashFirstSlice, documentHashSecondSlice, { from: hospitalAddress, gas: 400000 });

                                    logger.debug("printing upload transaction id : " + uploadTxid);
                                    logger.debug("printing policyId : " + policyId);
                                    var jsonResponse = {
                                        policyId: policyId,
                                        txId: transactionId
                                    }
                                    response.send(jsonResponse);
                                });
                            });
                        }, 2000);
                    });
                }, 10000);
            });
        } else {
            response.send({
                "error": "Error in initiateClaim"
            });
        }
    } catch (e) {
        logger.error("Error : " + e);
    }
});


/**
 * API to get initial claimDetails
 * 
 * @function                    getInititalClaimDetails 
 * @param       {number}        claimId                     - claimId of the patient
 * 
 * @returns     {JSONObject}    initialClaimDetails         - initital claim details of the customer
 */
app.get('/getInitialClaimDetails', function (request, response) {
    logger.debug("************************** initial claim details *********************************");
    var claimId = request.query.claimId;
    //fetch data from blockchain
    var initialClaimObject = deployedClaimContract['getInitialClaimDetails'](claimId);
    logger.debug("printing initial claim details : " + initialClaimObject);
    var initialClaimDetails = {
        patientAddress: initialClaimObject[0],
        policyId: initialClaimObject[1],
        timestamp: initialClaimObject[2],
        claimEstimate: initialClaimObject[3],
        estimateDocument: web3.toUtf8(initialClaimObject[4]) + web3.toUtf8(initialClaimObject[5]),
        initiallyApprovedBy: initialClaimObject[6]
    }

    response.send(initialClaimDetails);
});


/**
 * 
 * API to get claim details
 * 
 * @function                        getClaimDetails
 * @param           {number}        claimId                 - claimId of the patient
 * @returns         {JSONObject}    claimDetails            - claim details of the patient
 */

app.get('/getClaimDetails', function (request, response) {
    logger.debug("**************************** get claim details of the patient **********************");
    var claimId = request.query.claimId;
    var claimDetailsObject = deployedClaimContract['getClaimDetails'](claimId);
    var claimOwnersObject = deployedClaimContract['getClaimOwners'](claimId);

    logger.debug("printing claim details : " + JSON.stringify(claimDetailsObject));
    logger.debug("printing owner details : " + JSON.stringify(claimOwnersObject));

    var bill;
    logger.debug("printing length " + claimDetailsObject[1]);
    if (claimDetailsObject[1] == 0) {
        bill = "notFound"
    } else {
        bill = (web3.toUtf8(claimDetailsObject[1][0]) + web3.toUtf8(claimDetailsObject[2][0]));
    }



    //get names of policyOwners
    var brokerName = web3.toUtf8(deployedInsuranceContract['getCompanyName'](claimOwnersObject[0]));
    var insuranceName = web3.toUtf8(deployedInsuranceContract['getCompanyName'](claimOwnersObject[1]));
    var tpaName = web3.toUtf8(deployedInsuranceContract['getCompanyName'](claimOwnersObject[2]));

    var claimDetails = {
        claimStatus: web3.toUtf8(claimDetailsObject[0]),
        bill: bill,
        claimAmount: claimDetailsObject[3],
        brokerAddress: claimOwnersObject[0],
        insuranceAddress: claimOwnersObject[1],
        tpaAddress: claimOwnersObject[2],
        brokerName: brokerName,
        insuranceName: insuranceName,
        tpaName: tpaName
    }

    logger.debug("printing claim details : " + claimDetails);
    response.send(claimDetails);
});


/**
 * API to upload bills
 * 
 * @function                        uploadBill
 * @param           {number}        claimId         -   claimId of the patient
 * @param           {file}          claimDocument   -   claim document or bill        
 */

app.post('/uploadBill', function (request, response) {

    try {
        var claimId = request.body.claimId;
        var claimAmount = request.body.claimAmount;

        var isError = false;
        if (isNaN(claimId)) {
            console.log(new Error("claimId is not a number"));
            isError = true;
        } else {
            if (isNaN(claimAmount)) {
                console.log(new Error("claimAmount is not a number"));
                isError = true;
            }
        }

        if (isError == false) {

            logger.debug("printing claimId : " + claimId);
            logger.debug("printing claimAmount : " + claimAmount);
            // check for documents
            if (!request.files) {
                logger.debug(" Document not found. Please upload it again :( ");
                return response.status(400).send('No files were uploaded.');
            }

            //prepare files array (contains name and file buffer of document)
            const files = [
                {
                    path: request.files.claimDocument.name,
                    content: request.files.claimDocument.data
                },
            ]

            //upload file to ipfs and then send the hash to ledger
            ipfs.files.add(files, (err, filesAdded) => {
                logger.debug(filesAdded);
                logger.debug("printing policyDocument hash : " + filesAdded[0].hash);
                var claimDocumentDocHash = filesAdded[0].hash;

                var documentHashFirstSlice = claimDocumentDocHash.slice(0, 26);
                var documentHashSecondSlice = claimDocumentDocHash.slice(26, claimDocumentDocHash.length);
                logger.debug("hash first slice " + documentHashFirstSlice);
                logger.debug("hash second slice " + documentHashSecondSlice);
                web3.personal.unlockAccount(hospitalAddress, hospitalWalletPassword);
                logger.debug("customer account unlocked");
                //var transactionId = deployedPolicyContract['createPolicy'](marshAddress, customerAddress, policyValidity, documentHashFirstSlice, documentHashSecondSlice, insuranceContractAddress, insuranceAddress, tpaAddress,{from: String(customerAddress), gas: 4000000});
                var transactionId = deployedClaimContract['uploadClaimDocuments'](claimId, hospitalAddress, documentHashFirstSlice, documentHashSecondSlice, claimAmount, { from: String(hospitalAddress), gas: 4000000 });

                logger.debug("printing transaction id : " + transactionId);
                var jsonResponse = {
                    txId: transactionId
                }
                //response.send(jsonResponse);
                logger.debug("redirecting ");
                //response.redirect("http://"+hospitalNodeIp+":"+hospitalPort+"/Hospital/index.html");

                response.send({ txId: transactionId });

            });
        } else {
            response.send({
                "error": "Error in uploadBill"
            });
        }
    } catch (e) {
        logger.error("Error : "+e);
    }
});

/**
 * API to get claim status
 * 
 * @function                    getClaimStatus
 * 
 * @param       {claimId}       claimId         - claimId of the patient
 * @returns     {JSONObject}    claimStatus     - claimStatus of the patient
 * 
 */

app.get('/getClaimStatus', function (request, response) {
    var claimId = request.query.claimId;

    var claimDetailsObject = deployedClaimContract['getClaimDetails'](claimId);
    var claimOwnersObject = deployedClaimContract['getClaimOwners'](claimId);

    logger.debug("printing claim details : " + claimDetailsObject);

    var claimStatus = {
        claimStatus: web3.toUtf8(claimDetailsObject[0]),
        claimAmount: claimDetailsObject[3],
        brokerAddress: claimOwnersObject[0],
        insuranceAddress: claimOwnersObject[1],
        tpaAddress: claimOwnersObject[2]
    }

    logger.debug("printing claim details : " + claimStatus);
    response.send(claimStatus);
});



/**
 * API to get list of all claims
 * 
 * @function                            getAllClaims
 * 
 * @returns          {JSONArray}        claimList
 * 
 */
/*
app.get('/getAllClaims',function(request, response){

    var claimListObject = deployedClaimContract['getClaimList']();
    var claimList=[];
    for(var index = 0; index < claimListObject.length; index++){
        var claimId = claimListObject[index];
        var initialClaimObject = deployedClaimContract['getInitialClaimDetails'](claimId);
        logger.debug("printing initial claim details : "+initialClaimObject);

        var patientDetailsObject = deployedHospitalContract['getPatientDetails'](initialClaimObject[0]);
        var patientName = patientDetailsObject[2];

        var claimDetailsObject = deployedClaimContract['getClaimDetails'](claimId);

        var approverName =web3.toUtf8(deployedInsuranceContract['getCompanyName'](initialClaimObject[6]));

        var initialClaimDetails = {
            claimId:claimId,
            claimStatus:web3.toUtf8(claimDetailsObject[0]),
            patientAddress:initialClaimObject[0],
            patientName:patientName,
            policyId:initialClaimObject[1],
            timestamp:initialClaimObject[2],
            claimEstimate:initialClaimObject[3],
            estimateDocument:web3.toUtf8(initialClaimObject[4])+web3.toUtf8(initialClaimObject[5]),
            initiallyApprovedBy:initialClaimObject[6],
            approverName:approverName,
        }

        claimList.push(initialClaimDetails);
    }

    response.send(claimList.reverse());
});
*/



//function to get all claims

app.get('/getAllClaims', function (request, response) {
    logger.debug("**************** Get Claim Request List ******************");
    claimListDB.collection("claimlist").find().toArray(function (err, result) {
        if (err) throw err;
        logger.debug(result);
        return response.send(result.reverse());
    });
});
















/**
 * 
 * function to sync all claim list for hospital
 * 
 */




function syncAllClaims() {
    logger.debug("************************ calling sync all claims ******************************");


}


















/**
 * API to get claims per patient
 * @function                    getPatientClaims
 * @param       {string}        patientAddress      -   wallet address of the patient
 * @returns     {JSONObject}    patientClaims       -   patientClaims
 */

app.get('/getPatientClaims', function (request, response) {
    var patientAddress = request.query.patientAddress;

    var patientClaimsArray = deployedClaimContract['getPatientClaims'](patientAddress);
    logger.debug(patientClaimsArray);
    var patientClaims = {
        patientClaims: patientClaimsArray
    }

    response.send(patientClaims);
});



/**
 * 
 * API to get hospital details
 * 
 * @function      getHospitalInfo
 * 
 * @returns {JSONObject}    hospitalDetails
 */
app.get("/getHospitalInfo", function (request, response) {

    var hospitalDetails = {
        hospitalName: hospitalName,
        hospitalAddress: hospitalAddress
    }

    response.send(hospitalDetails);
});


/**
 * 
 * API to get all patients
 * @function                    getAllPatients
 * @returns     {JSONArray}     allPatients
 * 
 */

app.get('/getAllPatients', function (request, response) {
    logger.debug("************************* get all patients ****************************");
    var url = mongoUrl + hospitalName;
    var allPatients = [];

    patientListDB.listCollections().toArray(function (err, result) {
        if (err) throw err;
        //logger.debug(result);
        //db.close();
        result = result.sort({ registrationTimeStamp: -1 });
        for (var index = 0; index < result.length; index++) {

            var collectionsName = result[index].name;
            //logger.debug("printing collections name"+collectionsName);
            patientListDB.collection(collectionsName).find({}).toArray(function (err, record) {
                if (err) throw err;
                //logger.debug("printing record : "+JSON.stringify(record[0]));
                allPatients.push(record[0]);
            });
        }

        let promiseA = new Promise((resolve, reject) => {
            let wait = setTimeout(() => {
                response.setHeader('Content-Type', 'application/json');
                response.send(allPatients);
            }, 2000);
        })
    });
});


/**
 * 
 * API to get patient by patient name and policyId
 * 
 * @function                    getPatientTransactions
 * @param       {string}        patientName
 * @param       {policyId}      policyId
 * @returns     {JSONArray}     get all trasactions of a patient
 */
app.get('/getPatientTransactions', function (request, response) {

    var patientName = request.query.patientName;
    var policyId = request.query.policyId;

    logger.debug("****************************** get all patient transactions *************************");
    var patientTransactions = [];
    var collectionName = patientName + policyId + "_txns";
    hospitalTxnsDB.collection(collectionName).find().toArray(function (err, transactionList) {
        if (err) throw err;
        logger.debug(transactionList);
        return response.send(transactionList.reverse());
    });
});

/**
 * function to create claim estimate document
 * @function            createClaimEstimateDocument
 * 
 */
function createClaimEstimateDocument(claimId, policyId, claimEstimate, patientAddress) {
    logger.debug("*********************** creating estimate document     *************************");

    try {

        var isError = false;

        if (isNaN(claimId)) {
            console.log(new Error("claimId is not a number"));
            isError = true;
        } else {
            if (isNaN(policyId)) {
                console.log(new Error("policyId is not a number"));
                isError = true;
            } else {
                if (isNaN(claimEstimate)) {
                    console.log(new Error("claimEstimate is not a number"));
                    isError = true;
                }
            }
        }

        if (isError == false) {

            //get claim and patient details first
            var initialClaimObject = deployedClaimContract['getInitialClaimDetails'](claimId);
            logger.debug("printing initial claim details : " + initialClaimObject);
            var initialClaimDetails = {
                patientAddress: initialClaimObject[0],
                policyId: initialClaimObject[1],
                timestamp: initialClaimObject[2],
                claimEstimate: initialClaimObject[3],
                estimateDocument: web3.toUtf8(initialClaimObject[4]) + web3.toUtf8(initialClaimObject[5]),
                initiallyApprovedBy: initialClaimObject[6]
            }
            var patientObject = deployedHospitalContract['getPatientDetails'](patientAddress);
            logger.debug("printing patientName:  " + patientObject[2]);



            var patientName = patientObject[2];
            console.log("Printing intialClaimDetails.timestamp");
            var theDate = new Date(((initialClaimDetails.timestamp).toString().slice(0,-9)) * 1000);
            console.log("printing date before converting to locale string : "+theDate);
            var date = theDate.toLocaleDateString();
            var policyId = initialClaimDetails.policyId;
            var text = "The above estimate is based on minimum requirements as per medical officer. There might extra charges on final estimate."

            var signature = hospitalName;
            doc = new PDFDocument;
            doc.pipe(fs.createWriteStream('claims/claimEstimate_' + claimId + '.pdf'));
            //writing claim details ti the pdf

            doc.image('images/hospitalLogo.jpeg');
            doc.moveDown();


            doc.fontSize(9).text('claimId is        :   ' + claimId);
            doc.moveDown();
            doc.fontSize(9).text('patient Name      :   ' + patientName);
            doc.moveDown();
            doc.fontSize(9).text('PolicyId          :   ' + policyId);
            doc.moveDown();
            doc.fontSize(9).text('Hospital Name     :   ' + "ABCHospital");
            doc.moveDown();
            doc.fontSize(9).text('Hospital Address  :   ' + hospitalAddress);
            doc.moveDown();
            doc.fontSize(9).text('Initial Estimate  :   ' + '$' + claimEstimate);
            doc.moveDown();
            doc.fontSize(9).text('Date              :   ' + date);
            doc.moveDown();


            //text
            doc.fontSize(9).text(text);
            doc.moveDown();
            doc.moveDown();
            doc.moveDown();
            doc.fontSize(11).text(signature);

            logger.debug("*********************** claim estimate document stored *************************");
            doc.end();
        } else {
            logger.error("Error in createClaimEstimateDocument");
        }
    } catch (e) {
        logger.error("Error : " + e);
    }
}


/**
 * Store hospital transactions
 * 
 * @function                        storeHospitalTransactions
 * 
 * @param       {string}            hospitalName
 * @param       {string}            tx_id
 * @param       {string}            description
 */

function storeHospitalTransactions(patientName, policyId, tx_id, description, claimId) {

    try {

        /*
        var isError = false;

        if (isNaN(policyId)) {
            console.log(new Error("policyId is not a number"));
            isError = true;
        } else {
            if (isNaN(claimId)) {
                console.log(new Error("claimId is not a number"));
                isError = true;
            }
        }
        
        if (isError == false) {
            */
            logger.debug("***************** store hospital transactions to database *******************");

            var date_time;

            // get blocktimestamp by fetching blockdata
            logger.debug("printing tx_id" + tx_id);
            logger.debug("fetching transaction data  ");
            var transactionData = web3.eth.getTransaction(tx_id);

            logger.debug(transactionData);

            logger.debug("fetching block data  ");
            var blockNumber = transactionData.blockNumber;

            var blockData = web3.eth.getBlock(blockNumber);
            logger.debug("fetching block timestamp  ");
            date_time = blockData.timestamp;

            logger.debug("printing block timestamp   " + date_time);

            let promiseA = new Promise((resolve, reject) => {
                let wait = setTimeout(() => {

                    logger.debug("************ connected to mongodb client at localhost *************");
                    logger.debug("********** storing record **********");
                    var myobj = { patientName: patientName, transactionId: tx_id, dateTime: date_time, description: description, claimId: claimId };

                    var collectionName = patientName + policyId + "_txns";
                    hospitalTxnsDB.collection(collectionName).insertOne(myobj, function (err, res) {
                        if (err) throw err;
                        logger.debug("Transaction  record inserted ....");
                    });
                });
            }, 3000);
            /*
        } else {
            console.log("Error in storeHospitalTransactions");
        }
        */
    } catch (e) {
        logger.error("Error : " + e);
    }
}




/**
 * 
 * @param {*} claimId 
 * @param {*} claimStatus 
 */
function updateClaimRecord(claimId, claimStatus) {
    //update claim record

    try {

        var isError = false;
        if (isNaN(claimId)) {
            console.log("claimId is not a number");
            isError = true;
        }

        if (isError == false) {

            logger.info("updateClaimRecord");
            var query = { claimId: claimId.toNumber() };

            var initialClaimObject = deployedClaimContract['getInitialClaimDetails'](claimId);
            var initiallyApprovedBy = initialClaimObject[6];
            var approverName = deployedInsuranceContract['getCompanyName'](initialClaimObject[6]);

            var newValues = {
                $set: {
                    claimStatus: web3.toUtf8(claimStatus),
                    initiallyApprovedBy: initiallyApprovedBy,
                    approverName: web3.toUtf8(approverName)
                }
            }

            claimListDB.collection("claimlist").updateOne(query, newValues, function (err, doc) {
                if (err) throw err;
                logger.debug("claimlist_db updated ..");
            });
        } else {
            logger.error("Error in updateClaimRecord");
        }
    } catch (e) {
        logger.error("Error : " + e);
    }
}


/*
function updateApproverInfo(claimId) {
    //method to update initial approver info
    //update approver name and approver address
    //
    logger.info("updateApproverInfo");
    logger.debug("claimId : " + claimId);

    var initialClaimObject = deployedClaimContract['getInitialClaimDetails'](claimId);
    initiallyApprovedBy = initialClaimObject[6];
    var approverName = deployedInsuranceContract['getCompanyName'](initialClaimObject[6]);

    var query = { claimId: claimId.toNumber() };
    var newValues = {
        $set: {
            initiallyApprovedBy: initiallyApprovedBy,
            approverName: approverName
        }
    }

    claimListDB.collection("claimlist").updateOne(query, newValues, function (err, doc) {
        if (err) throw err;
        logger.debug("claimlist_db updated ..");
    });

}
*/


function updateEstimateDocument(claimId) {

    //method to update claimlist_db
    //Just update estimateDocument key in the record
    //search the record by claimid

    try {
        logger.info("updateEstimateDocument");
        var isError = false;
        if (isNaN(claimId)) {
            console.log(new Error("claimId is not a number"));
            isError = true;
        }

        if (isError == false) {


            logger.debug("claimId : " + claimId);


            var query = { claimId: claimId.toNumber() };
            var initialClaimObject = deployedClaimContract['getInitialClaimDetails'](claimId);
            estimateDocument = web3.toUtf8(initialClaimObject[4]) + web3.toUtf8(initialClaimObject[5]);

            var newValues = {
                $set: {
                    estimateDocument: estimateDocument
                }
            }

            claimListDB.collection("claimlist").updateOne(query, newValues, function (err, doc) {
                if (err) throw err;
                logger.debug("claimlist_db updated ..");
            });
        } else {
            console.log("Error in updateEstimateDocument");
        }
    } catch (e) {
        logger.error("Error : " + e);
    }
}


/**
 * 
 * @param {*} claimId
 */
function insertClaimRecord(claimId) {
    logger.info("insertClaimRecord");

    try {

        var isError = false;

        if (isNaN(claimId)) {
            console.log(new Error("claimId is not a number"));
        }

        if (isError == false) {

            var initialClaimObject = deployedClaimContract['getInitialClaimDetails'](claimId);
            // console.log("printing initial claim details : "+initialClaimObject);
            var patientDetailsObject = deployedHospitalContract['getPatientDetails'](initialClaimObject[0]);
            var patientName = patientDetailsObject[2];
            var claimDetailsObject = deployedClaimContract['getClaimDetails'](claimId);
            var approverName = web3.toUtf8(deployedInsuranceContract['getCompanyName'](initialClaimObject[6]));
            var initialClaimDetails = {
                claimId: claimId.toNumber(),
                claimStatus: web3.toUtf8(claimDetailsObject[0]),
                patientAddress: initialClaimObject[0],
                patientName: patientName,
                policyId: initialClaimObject[1].toNumber(),
                timestamp: initialClaimObject[2].toNumber(),
                claimEstimate: initialClaimObject[3].toNumber(),
                estimateDocument: web3.toUtf8(initialClaimObject[4]) + web3.toUtf8(initialClaimObject[5]),
                initiallyApprovedBy: initialClaimObject[6],
                approverName: approverName,
            }




            //push the object into mongodb 
            var query = { claimId: claimId.toNumber() };
            var obj = initialClaimDetails;
            claimListDB.collection("claimlist").update(query, obj, { upsert: true }, function (err, doc) {
                if (err) throw err;
                logger.debug("Record inserted/updated ..");
            });
        } else {
            logger.error("Error in insertClaimRecord");
        }
    } catch (e) {
        logger.error("Error : " + e);
    }
}

/**
 * 
 * viewClaimInfo function to get claim details
 * 
 */
app.get('/viewClaimInfo', function(req, res){
    logger.info("viewClaimInfo");
        
    var policyId = req.query.policyId;
    var patientName = req.query.patientName;
    var claimId = req.query.claimId;

    logger.debug("policyId : "+policyId);
    logger.debug("patientName : "+patientName);
    logger.debug("claimId : "+claimId);

    //getHospitalInfo
    var hospitalDetails = {
        hospitalAddress: hospitalAddress
    }

    //getPolicyDetails
    var policyObject = deployedPolicyContract['getPolicy'](policyId, hospitalAddress);
    logger.debug("printing policyObject : " + JSON.stringify(policyObject));

    //get dependent details
    var dependentsObject = deployedPolicyContract['getDependents'](policyId);

    logger.debug("printing dependents list : " + dependentsObject);
    logger.debug("converting all list objects to utf8 ");

    //get company name
    var policyProviderName = deployedInsuranceContract['getCompanyName'](policyObject[0]);
    logger.debug("policy provider name is : " + web3.toUtf8(policyProviderName));
    var policyDetailsObject = deployedPolicyContract['getPolicy'](policyId, "");
    var policyHolderAddress = policyDetailsObject[1];
    var policyHolderDetails = deployedPolicyContract['getCustomerDetails'](policyHolderAddress);

    var insuredAmount = policyHolderDetails[3];
    var policyHoldername = policyHolderDetails[1];

    var policyDetails = {
        policyId: policyId,
        policyHolderName: policyHoldername,
        policyProviderAddress: policyObject[0],
        policyProviderName: web3.toUtf8(policyProviderName),
        policyValidity: policyObject[2],
        policyDocumentHash: web3.toUtf8(policyObject[3]) + web3.toUtf8(policyObject[4]),
        timeStamp: policyObject[5],
        sumInsured: insuredAmount
    }

    //getInitialClaimDetails
    var initialClaimObject = deployedClaimContract['getInitialClaimDetails'](claimId);
    logger.debug("printing initial claim details : " + initialClaimObject);
    var initialClaimDetails = {
        claimEstimate: initialClaimObject[3],
        estimateDocument: web3.toUtf8(initialClaimObject[4]) + web3.toUtf8(initialClaimObject[5]),
        initiallyApprovedBy: initialClaimObject[6]
    }

    var claimInfo = {
        hospitalInfo:hospitalDetails,
        initialClaimDetails:initialClaimDetails,
        policyDetails:policyDetails
    }

    logger.debug("claimInfo : "+JSON.stringify(claimInfo));

    res.send(claimInfo);

});






/**
 * viewClaimDetails
 * 
 */
app.get('/viewClaimDetails', function(req, res){

    /*
    Required values :
    hospitalAddress
    policyHolderName
    policyId
    policyValidity
    policyProviderName
    timeStamp // policyIssuedAt

    sumInsured
    policyDocumentHash
    estimateDocumentHash
    */

    logger.info("viewClaimDetails");
    
    var policyId = req.query.policyId;
    var patientName = req.query.patientName;
    var claimId = req.query.claimId;

    logger.debug("policyId : "+policyId);
    logger.debug("patientName : "+patientName);
    logger.debug("claimId : "+claimId);


    //getPolicyDetails
    var policyObject = deployedPolicyContract['getPolicy'](policyId, hospitalAddress);
    logger.debug("printing policyObject : " + JSON.stringify(policyObject));

    //get dependent details
    var dependentsObject = deployedPolicyContract['getDependents'](policyId);

    logger.debug("printing dependents list : " + dependentsObject);
    logger.debug("converting all list objects to utf8 ");
    var dependentList = [];
    var dependentObject;

    for (var index = 0; index < dependentsObject[0].length; index++) {

        //get dependent details
        var dependentDetailsObject = deployedPolicyContract['getDependentDetails'](dependentsObject[1][index]);

        logger.debug("printing age : " + dependentDetailsObject[1]);
        logger.debug("printing gender : " + dependentDetailsObject[2]);

        dependentObject = {
            dependentName: web3.toUtf8(dependentsObject[0][index]),
            dependentId: dependentsObject[1][index],
            age: dependentDetailsObject[1],
            gender: web3.toUtf8(dependentDetailsObject[2]),
            relation: web3.toUtf8(dependentDetailsObject[3])
        }

        dependentList.push(dependentObject);
    }

    //get company name

    var policyProviderName = deployedInsuranceContract['getCompanyName'](policyObject[0]);

    logger.debug("policy provider name is : " + web3.toUtf8(policyProviderName));

    var policyDetailsObject = deployedPolicyContract['getPolicy'](policyId, "");

    var policyHolderAddress = policyDetailsObject[1];

    var policyHolderDetails = deployedPolicyContract['getCustomerDetails'](policyHolderAddress);

    var insuredAmount = policyHolderDetails[3];
    var policyHoldername = policyHolderDetails[1];

    var policyDetails = {
        policyId: policyId,
        policyHolderName: policyHoldername,
        policyProviderAddress: policyObject[0],
        policyProviderName: web3.toUtf8(policyProviderName),
        policyValidity: policyObject[2],
        policyDocumentHash: web3.toUtf8(policyObject[3]) + web3.toUtf8(policyObject[4]),
        timeStamp: policyObject[5],
        dependents: dependentList,
        sumInsured: insuredAmount
    }

    //getHospitalInfo
    var hospitalDetails = {
        hospitalName: hospitalName,
        hospitalAddress: hospitalAddress
    }


    //getInitialClaimDetails
    //fetch data from blockchain
    var initialClaimObject = deployedClaimContract['getInitialClaimDetails'](claimId);
    logger.debug("printing initial claim details : " + initialClaimObject);
    var initialClaimDetails = {
        patientAddress: initialClaimObject[0],
        policyId: initialClaimObject[1],
        timestamp: initialClaimObject[2],
        claimEstimate: initialClaimObject[3],
        estimateDocument: web3.toUtf8(initialClaimObject[4]) + web3.toUtf8(initialClaimObject[5]),
        initiallyApprovedBy: initialClaimObject[6]
    }
    

    //getPatientInfo
    var userName = patientName + policyId;
    var patientInfo;
    try {
        hospitalDB.collection(userName).find().toArray(function (err, patientObject) {
            if (err) {
                logger.debug("error");
                throw err;
            }
            logger.debug(patientObject);
            if (patientObject.length == 0) {
                jsonResponse = {
                    error: "failed to fetch data"
                }
                //response.send(jsonResponse);
            } else {
                patientInfo = {
                    patientName: patientObject[0].patientName,
                    dob: patientObject[0].dob,
                    policyId: patientObject[0].policyId,
                    gender: patientObject[0].gender,
                    walletAddress: patientObject[0].walletAddress,
                    emailId: patientObject[0].emailId,
                    age: patientObject[0].age
                }
            }

            var claimDetails = {
                patientInfo : patientInfo,
                initialClaimDetails: initialClaimDetails,
                hospitalDetails: hospitalDetails,
                policyDetails: policyDetails
            }

            res.send(claimDetails);
        });
    } catch (Exception) {
        logger.debug("error in fetching data");
    }

});

/**
 * 
 * API to get file from ipfs
 * 
 */
app.get('/ipfs', function (req, res) {
    logger.info("ipfs");
    var fileHash = req.query.fileHash;

    //create and ipfs url and return
    logger.debug("fileHash : "+fileHash);

    /*
    ipfs.files.cat(fileHash, function (err, file) {
        if (err) throw err;
        res.send(file);
    });
    */
   res.send({
        ipfsUrl : "http://"+appIpAddress+":8080/ipfs/"+fileHash
    });
});


app.get('/index',function(req,res){
	res.sendFile(path.join(__dirname+'/UI/index.html'));
	//res.sendFile('/AirportDashboard/index.html');

});


app.use('/', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    var message = {
        message: "API service for Marsh on Quorum"
    }
    res.send(message);
});


// ************** app runs at 0.0.0.0 at port 5002 *****************************
app.listen(appPort, appIp, function () {
    logger.debug("Application  listening on at " + appIp + " Port : " + appPort);
})




