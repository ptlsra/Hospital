var ipAddress=ipAddress();
var portNo=portNo();

var ipfsPortNo=ipfsPortNo();
var ipfsIpAddress=ipfsIpAddress();


var tempLists=[];
var dataSets=[];
 
		/* 
		*	Get All Patients Registered With Hospital.
		*/
		
		
		$.ajax({
			 
		 	dataType: "json",
			//url: "http://"+ipAddress+":"+portNo+"/getAllClaims",
			url: "/getAllClaims",
            global: false,
            type: 'GET',
            async: false, //blocks window close
            success: function(response) {
         //   alert(JSON.stringify(response));
          		$.each(response, function(i, item) {
          			var amount=item.claimEstimate;
          		  var strRepass = amount;
          		//	alert(amount)
          			//item.claimEstimate;
          			/*
     		 	   var strRepass = amount.split('.');
     		      if (strRepass[0].length >= 4) {
     		      	strRepass[0] = strRepass[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
     		      }
     		      if (strRepass[1] && strRepass[1].length >= 4) {
     		      	strRepass[1] = strRepass[1].replace(/(\d{3})/g, '$1 ');
     		      }
     		      strRepass.join('.');
     		      
     		      */

  				strRepass=strRepass.toFixed().replace(/(\d)(?=(\d{3})+(,|$))/g, '$1,')

     		      
     		     var unixtimestamp = item.timestamp;
  				unixtimestamp=unixtimestamp.toString().slice(0,-9);

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
     		      
     		     
          		//alert(JSON.stringify(item));
          		var name=item.patientName;
          		var nameReplaced = name.split('_').join(' ');
          		var claimStatus=item.claimStatus;
          		if(claimStatus=='initialApprovalPending'){
          			var displayStatus="Initial Approval Pending"
          		//tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,"$"+strRepass,'<a title="'+ item.walletAddress+'"href=#?'+item.walletAddress+ '>'+item.walletAddress.substr(0, 20)+'....','<a  href=InitateClaimDetails.html?policyId='+item.policyId+'&patientAddress='+item.walletAddress+'&name='+name+'> Initiate Claim');
          		tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,convdataTime,strRepass,'<a  href=ViewClaimDetails.html?policyId='+item.policyId+'&patientAddress='+item.patientAddress+'&name='+name+'&claimId='+item.claimId+'&claimEstimate='+amount+'>'+ displayStatus,'');
          		dataSets.push(tempLists);
          		tempLists=[];
          		}
          		
          		if(claimStatus=='needInsuranceApproval'){
          			var displayStatus="Insurance Approval Pending"
          		//tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,"$"+strRepass,'<a title="'+ item.walletAddress+'"href=#?'+item.walletAddress+ '>'+item.walletAddress.substr(0, 20)+'....','<a  href=InitateClaimDetails.html?policyId='+item.policyId+'&patientAddress='+item.walletAddress+'&name='+name+'> Initiate Claim');
          		tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,convdataTime,strRepass,'<a  href=ViewClaimDetails.html?policyId='+item.policyId+'&patientAddress='+item.patientAddress+'&name='+name+'&claimId='+item.claimId+'&claimEstimate='+amount+'>'+ displayStatus,'');
          		dataSets.push(tempLists);
          		tempLists=[];
          		}
          		
          		
          		
 if(item.claimStatus=="billsPending"){
					 
					 if (item.approverName=="tpa"||item.approverName=="TPA" ){
							
						 var displayStatus="Initial Approval Done by TPA"
				          		//tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,"$"+strRepass,'<a title="'+ item.walletAddress+'"href=#?'+item.walletAddress+ '>'+item.walletAddress.substr(0, 20)+'....','<a  href=InitateClaimDetails.html?policyId='+item.policyId+'&patientAddress='+item.walletAddress+'&name='+name+'> Initiate Claim');
				          		tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,convdataTime,strRepass,displayStatus,'<a  href=UploadBills.html?policyId='+item.policyId+'&patientAddress='+item.patientAddress+'&name='+name+'&claimId='+item.claimId+'&claimEstimate='+amount+'> Upload Bills');
				          		dataSets.push(tempLists);
				          		tempLists=[];
				
						}  
					 
					 
					 
					 else if (item.approverName=="mBroker"||item.approverName=="mbroker" ){
							
						 var displayStatus="Initial Approval Done by mBroker"
				          		//tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,"$"+strRepass,'<a title="'+ item.walletAddress+'"href=#?'+item.walletAddress+ '>'+item.walletAddress.substr(0, 20)+'....','<a  href=InitateClaimDetails.html?policyId='+item.policyId+'&patientAddress='+item.walletAddress+'&name='+name+'> Initiate Claim');
				          		tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,convdataTime,strRepass,displayStatus,'<a  href=UploadBills.html?policyId='+item.policyId+'&patientAddress='+item.patientAddress+'&name='+name+'&claimId='+item.claimId+'&claimEstimate='+amount+'> Upload Bills');
				          		dataSets.push(tempLists);
				          		tempLists=[];
					
						}  
					 
					 else{
						 var displayStatus="Initial Approval Done by Insurer "
				          		//tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,"$"+strRepass,'<a title="'+ item.walletAddress+'"href=#?'+item.walletAddress+ '>'+item.walletAddress.substr(0, 20)+'....','<a  href=InitateClaimDetails.html?policyId='+item.policyId+'&patientAddress='+item.walletAddress+'&name='+name+'> Initiate Claim');
				          		tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,convdataTime,strRepass,displayStatus,'<a  href=UploadBills.html?policyId='+item.policyId+'&patientAddress='+item.patientAddress+'&name='+name+'&claimId='+item.claimId+'&claimEstimate='+amount+'> Upload Bills');
				          		dataSets.push(tempLists);
				          		tempLists=[];
					 }
						
					
					}  
          		
          		
          		
          		 if(item.claimStatus=="finalApprovalPending"){
          			 
          			 
					 if (item.approverName=="TPA"||item.approverName=="tpa" ){
							
							var displayStatus="FinalApproval Pending From TPA ";
							
			          		tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,convdataTime,strRepass,'<a  href=FinalApprovalPending.html?policyId='+item.policyId+'&patientAddress='+item.patientAddress+'&name='+name+'&claimId='+item.claimId+'&claimEstimate='+amount+'>'+ displayStatus,'');
							dataSets.push(tempLists);
							tempLists=[];
				
						}  
					 else if (item.approverName=="mBroker"||item.approverName=="mbroker" ){
						var displayStatus="FinalApproval Pending From mBroker ";
						
		          		tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,convdataTime,strRepass,'<a  href=FinalApprovalPending.html?policyId='+item.policyId+'&patientAddress='+item.patientAddress+'&name='+name+'&claimId='+item.claimId+'&claimEstimate='+amount+'>'+ displayStatus,'');
						dataSets.push(tempLists);
						tempLists=[];
					
					}  
					 else{
						 var displayStatus="FinalApproval Pending From Insurance ";
							
			          		tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,convdataTime,strRepass,'<a  href=FinalApprovalPending.html?policyId='+item.policyId+'&patientAddress='+item.patientAddress+'&name='+name+'&claimId='+item.claimId+'&claimEstimate='+amount+'>'+ displayStatus,'');
							dataSets.push(tempLists);
							tempLists=[];
					 }
				 }
          		
          		
          		
          		if(claimStatus=='approved'){
					 if (item.approverName=="mBroker"||item.approverName=="mbroker" ){
						 var displayStatus="Claim Approved By mBroker";
			          		//tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,"$"+strRepass,'<a title="'+ item.walletAddress+'"href=#?'+item.walletAddress+ '>'+item.walletAddress.substr(0, 20)+'....','<a  href=InitateClaimDetails.html?policyId='+item.policyId+'&patientAddress='+item.walletAddress+'&name='+name+'> Initiate Claim');
			          		tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,convdataTime,strRepass,'<a  href=FinalApprovalDone.html?policyId='+item.policyId+'&patientAddress='+item.patientAddress+'&name='+name+'&claimId='+item.claimId+'&claimEstimate='+amount+'>'+ displayStatus,'');
			          		dataSets.push(tempLists);
			          		tempLists=[];
					}  
					 
					 
					 else if (item.approverName=="TPA"||item.approverName=="tpa" ){
						 var displayStatus="Claim Approved By TPA";
			          		//tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,"$"+strRepass,'<a title="'+ item.walletAddress+'"href=#?'+item.walletAddress+ '>'+item.walletAddress.substr(0, 20)+'....','<a  href=InitateClaimDetails.html?policyId='+item.policyId+'&patientAddress='+item.walletAddress+'&name='+name+'> Initiate Claim');
			          		tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,convdataTime,strRepass,'<a  href=FinalApprovalDone.html?policyId='+item.policyId+'&patientAddress='+item.patientAddress+'&name='+name+'&claimId='+item.claimId+'&claimEstimate='+amount+'>'+ displayStatus,'');
			          		dataSets.push(tempLists);
			          		tempLists=[];
					}  
					 else{
						 var displayStatus="Claim Approved By Insurance";
			          		//tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,"$"+strRepass,'<a title="'+ item.walletAddress+'"href=#?'+item.walletAddress+ '>'+item.walletAddress.substr(0, 20)+'....','<a  href=InitateClaimDetails.html?policyId='+item.policyId+'&patientAddress='+item.walletAddress+'&name='+name+'> Initiate Claim');
			          		tempLists.push(i+1,item.claimId,nameReplaced,item.policyId,convdataTime,strRepass,'<a  href=FinalApprovalDone.html?policyId='+item.policyId+'&patientAddress='+item.patientAddress+'&name='+name+'&claimId='+item.claimId+'&claimEstimate='+amount+'>'+ displayStatus,'');
			          		dataSets.push(tempLists);
			          		tempLists=[];
					 }
				 }
          		
          		
          		
          		});

				}
		
		
});	
	

	//alert(dataSet);
	$('#viewAllClaims').DataTable( {
		data: dataSets,
		columns: [
			 { title: "SNo" },
			 { title: "Claim ID" },
		    { title: "Patient Name" },
		  
		    {title:"Policy ID"},
		    {title:"Time Stamp"},
		    {title:"Amount(USD)"},
		    {title:"Current Status"},
		    
		    {title:"Action"}
		    
		
		  
		]
		
		 });	