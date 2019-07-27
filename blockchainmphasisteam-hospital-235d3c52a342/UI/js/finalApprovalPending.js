
var ipAdd=ipAddress();
var port=portNo();
var ipfsPortNo=ipfsPortNo();
var ipfsIpAddress=ipfsIpAddress();

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

var policyId = getUrlParameter('policyId');
var claimId = getUrlParameter('claimId');
document.getElementById("policyId").innerHTML = policyId;
var claimEstimate = getUrlParameter('claimEstimate');

var amount=claimEstimate;
var strRepass = amount;


var strRepass = amount.split('.');
 if (strRepass[0].length >= 4) {
 	strRepass[0] = strRepass[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
 }
 if (strRepass[1] && strRepass[1].length >= 4) {
 	strRepass[1] = strRepass[1].replace(/(\d{3})/g, '$1 ');
 }
 strRepass.join('.');
 
document.getElementById("claimEstimate").innerHTML = strRepass;


document.getElementById("claimIds").innerHTML = claimId;



var name = getUrlParameter('name');
var nameReplaced = name.split('_').join(' ');

var patientAddress = getUrlParameter('patientAddress');

document.getElementById("initClaim").innerHTML = "Claim Details For Claim ID: "+claimId;

document.getElementById("pAddress").innerHTML ='<a title="'+patientAddress+'"href=#?'+patientAddress+ '>'+patientAddress.substr(0, 20)+'....';
$("#est").hide();
$("#hospitalAddress").hide();
$("#patientAddress").hide();
$("#patientPolicyId").hide();
$("#claimAmount").hide();

//$("#insClaimEst").hide();




$("#patientAddress").val(patientAddress);
$("#patientPolicyId").val(policyId);

		
//$.get("http://"+ipAdd+":"+port+"/getClaimDetails?claimId="+claimId, function(claimResponse){
$.get("/getClaimDetails?claimId="+claimId, function(claimResponse){
	
	
//$.get("http://"+ipAdd+":"+port+"/getInitialClaimDetails?claimId="+claimId, function(response4){
$.get("/getInitialClaimDetails?claimId="+claimId, function(response4){


	 var amount=claimResponse.claimAmount;
	 var strRepass = amount;
	 
	 var strRepass = amount.split('.');
	  if (strRepass[0].length >= 4) {
	  	strRepass[0] = strRepass[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
	  }
	  if (strRepass[1] && strRepass[1].length >= 4) {
	  	strRepass[1] = strRepass[1].replace(/(\d{3})/g, '$1 ');
	  }
	  strRepass.join('.');

	$("#claimAmounts").val(strRepass);
	$("#claimAmounts").prop("readonly", true);
	 
	document.getElementById("InsurerName").innerHTML = claimResponse.insuranceName; 
	document.getElementById("tpa").innerHTML = claimResponse.tpaName; 

	
	
	 $('#btnShow2').click(function(){
         
         		
             $("#dialog").dialog({
                
                     maxWidth:600,
                     maxHeight: 450,
                     width: 600,
                     height: 450,
                     modal: true
                     
				 });
				 $.get("/ipfs?fileHash=" + claimResponse.bill, function (billDoc) {
					$("#frame").attr("src", billDoc.ipfsUrl);
				});
          //   $("#frame").attr("src", "http://"+ipfsIpAddress+":"+ipfsPortNo+"/ipfs/"+claimResponse.bill);
        // }); 
         });
	 
	 $('#btnShow3').click(function(){
         
  		
         $("#dialog").dialog({
            
                 maxWidth:600,
                 maxHeight: 450,
                 width: 600,
                 height: 450,
                 modal: true
                 
			 });
			 $.get("/ipfs?fileHash=" + response4.estimateDocument, function (custResponse) {
                $("#frame").attr("src", custResponse.ipfsUrl);
            });
        // $("#frame").attr("src", "http://"+ipfsIpAddress+":"+ipfsPortNo+"/ipfs/"+response4.estimateDocument);
    // }); 
     });
	
});
});


			
//$.get("http://"+ipAdd+":"+port+"/getPolicyDetails?policyId="+policyId, function(response){


$.get("/getPolicyDetails?policyId="+policyId, function(response){
	
	
	  // alert(JSON.stringify(response.people));
	//alert(JSON.stringify(response));
	
	
//	$.get("http://"+ipAdd+":"+port+"/getHospitalInfo", function(response2){
	$.get("/getHospitalInfo", function(response2){
		$.get("/getPatientInfo?patientName="+name+"&policyId="+policyId, function(response3){

		//$.get("http://"+ipAdd+":"+port+"/getPatientInfo?patientName="+name+"&policyId="+policyId, function(response3){

			 document.getElementById("patientName").innerHTML = nameReplaced; 

		$("#hospitalAddress").val(response2.hospitalAddress);

//		alert($("#hospitalAddress").val());

 document.getElementById("policyId").innerHTML = response.policyId; 
 $("#patientpolicyId").val(response.policyId);
 
 var policyHolderName=response.policyHolderName;
	policyHolderName = policyHolderName.split('_').join(' ');
	  document.getElementById("policyHolder").innerHTML = policyHolderName; 
 
 var unixtimestamp = response.policyValidity;

	 // Months array
	 var months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

	 // Convert timestamp to milliseconds
	 var date = new Date(unixtimestamp*1000);

	 // Year
	 var year = date.getFullYear();

	 // Month
	 var month = months_arr[date.getMonth()];

	 // Day
	 var day = date.getDate();

	 // Hours
	 var hours = date.getHours();

	 // Minutes
	 var minutes = "0" + date.getMinutes();

	 // Seconds
	 var seconds = "0" + date.getSeconds();

	 // Display date time in MM-dd-yyyy h:m:s format
	 var convdataTime = month+'-'+day+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
	
	 document.getElementById("policyValidity").innerHTML = convdataTime;
	 document.getElementById("policyProvider").innerHTML = response.policyProviderName;
	 
	 

	  unixtimestamp = response.timeStamp;
	  unixtimestamp=unixtimestamp.toString().slice(0,-9);

	 // Months array
	  months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

	 // Convert timestamp to milliseconds
	  date = new Date(unixtimestamp*1000);

	 // Year
	  year = date.getFullYear();

	 // Month
	  month = months_arr[date.getMonth()];

	 // Day
	 var day = date.getDate();

	 // Hours
	  hours = date.getHours();

	 // Minutes
	  minutes = "0" + date.getMinutes();

	 // Seconds
	  seconds = "0" + date.getSeconds();

	 // Display date time in MM-dd-yyyy h:m:s format
	  convdataTime = month+'-'+day+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
		 document.getElementById("timeStamp").innerHTML = convdataTime;
		 
		 

		 var amount=response.sumInsured;
		 var strRepass = amount;
		 
		 var strRepass = amount.split('.');
		  if (strRepass[0].length >= 4) {
		  	strRepass[0] = strRepass[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
		  }
		  if (strRepass[1] && strRepass[1].length >= 4) {
		  	strRepass[1] = strRepass[1].replace(/(\d{3})/g, '$1 ');
		  }
		  strRepass.join('.');

		 document.getElementById("sumInsured").innerHTML = strRepass;
		 $("#claimEstimate").blur(function(){
			 $("#est").hide();
		 	//var x = 100 + 50;
		 	var insAmount=response.sumInsured;
		 	var claimEstimate= $("#claimEstimate").val();
		 	$("#insClaimEst").val(claimEstimate);
		 	
		 	var diff=insAmount-claimEstimate;
		 	
		 	//if((sumInsured)
		 	if(diff>0){
//		 	alert(claimEstimate);
		 	var amounts=claimEstimate;
		 	var strRepass = amounts;
		 	
		 	   var strRepass = amounts.split('.');
		      if (strRepass[0].length >= 4) {
		      	strRepass[0] = strRepass[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
		      }
		      if (strRepass[1] && strRepass[1].length >= 4) {
		      	strRepass[1] = strRepass[1].replace(/(\d{3})/g, '$1 ');
		      }
		      strRepass.join('.');

		    $('#claimEstimate').val(strRepass);
		 	}
		 	else{
		 		$("#est").show();
		 		  $('#claimEstimate').val();
		 		
		 	}
		 });

			
		 
		 $('#btnShow').click(function(){
             //	$.get("http://"+ipAddress+":"+port+"/getDocumentHashByLoanId?loanId="+loanId, function(response){
             		  // alert(JSON.stringify(response.people));
             		//alert(JSON.stringify(response));
             		
             		 
             		// document.getElementById("propertyAddress").innerHTML = response.message.propertyAddress;
             		
             	
                 $("#dialog").dialog({
                    
                         maxWidth:600,
                         maxHeight: 450,
                         width: 600,
                         height: 450,
                         modal: true
                         
					 });
					 
					 $.get("/ipfs?fileHash=" + response.policyDocumentHash, function (policyDocLink) {
						$("#frame").attr("src", policyDocLink.ipfsUrl);
					});
                // $("#frame").attr("src", "http://"+ipfsIpAddress+":"+ipfsPortNo+"/ipfs/"+response.policyDocumentHash);
            // }); 
             });
		});
	});
	
		 
});
