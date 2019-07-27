var ipAdd=ipAddress();
var port=portNo();

var ipfsPortNo=ipfsPortNo();
var ipfsIpAddress=ipfsIpAddress();
$("#empty").hide();
$("#mainForm").hide();

//


var dependentAge=[];
var dependentGender=[];
var dependentName=[];

$("#enrollPatient").click(function(){
	$("#mainForm").show();

});
$('#soflow2').append($('<option>').text('Select Depenedent').attr('value', 'None'));


$("#soflow2").change(function(){
	var depName=$("#soflow2").val();
	var listLength=dependentAge.length;
	for(var index=0;index<listLength;index++){
		if(dependentName[index]==depName){
			$("#age").val(dependentAge[index]);
			$("#gender").val(dependentGender[index]);
		}
	}
  });

$("#searchButton").click(function(){
	var searchTerm=$("#searchTerm").val();
    //alert(searchTerm);
    if(searchTerm==""){
    	$("#empty").show();
    }
    else{
    	var table = document.getElementById("depTable");
		$.get("/getPolicyDetails?policyId="+searchTerm, function(response){

    	
    //$.get("http://"+ipAdd+":"+port+"/getPolicyDetails?policyId="+searchTerm, function(response){
    		  // alert(JSON.stringify(response.people));
    	//	alert(JSON.stringify(response));
    		 
    		var policyHolderName=response.policyHolderName;
    		policyHolderName = policyHolderName.split('_').join(' ');
    		  document.getElementById("policyHolder").innerHTML = policyHolderName; 
    		
    	   document.getElementById("policyId").innerHTML = response.policyId; 
    	   $("#patientpolicyId").val(response.policyId);
    	   
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
				
			    	
			 
				 var numberOfDep="";
    		 numberOfDep=response.dependents.length;
       		
			
          	 for(var i=0;i<numberOfDep;i++){
          		  row = table.insertRow(i+1);
           	     cell1 = row.insertCell(0);
           	     var cell2 = row.insertCell(1);
               	  var cell3 = row.insertCell(2);
               	 var cell4 = row.insertCell(3);
               	 var cell5 = row.insertCell(4);
               	 
               	 var depName=response.dependents[i].dependentName;
               	 depName = depName.split('_').join(' ');
           	    cell1.innerHTML = response.dependents[i].dependentId;
           	    cell2.innerHTML = depName;
           	    cell3.innerHTML = response.dependents[i].age;
           	    cell4.innerHTML = response.dependents[i].gender;
				   cell5.innerHTML = response.dependents[i].relation;

				   	dependentAge.push(response.dependents[i].age);
					dependentGender.push(response.dependents[i].gender);
					dependentName.push(depName);
				   $('#soflow2').append($('<option>').text(depName).attr('value', depName));
				   



          	 }
          	//numberOfDep="";

        	 
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
					 $.get("/ipfs?fileHash=" + response.policyDocumentHash, function (policyDocumentLink) {
						$("#frame").attr("src", policyDocumentLink.ipfsUrl);
					});
               //  $("#frame").attr("src", "http://"+ipfsIpAddress+":"+ipfsPortNo+"/ipfs/"+response.policyDocumentHash);
            // }); 
             });
          	 
       
    
    	
    	
    });
    	
     	
    
     
     

 
    }
    
});