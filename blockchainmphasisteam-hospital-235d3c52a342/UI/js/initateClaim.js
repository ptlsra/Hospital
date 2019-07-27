var ipAddress=ipAddress();
var portNo=portNo();

var ipfsPortNo=ipfsPortNo();
var ipfsIpAddress=ipfsIpAddress();


var tempLists=[];
var dataSets=[];
  var sampleArray=[];
		/* 
		*	Get All Patients Registered With Hospital.
		*/
		
		
		$.ajax({
			 
		 	dataType: "json",
		  //  url: "http://"+ipAddress+":"+portNo+"/getAllPatients",
		  url: "/getAllPatients",
            global: false,
            type: 'GET',
            async: false, //blocks window close
            success: function(response) {
            	
            	
            	
           // 	  alert(JSON.stringify(response));
          		$.each(response, function(i, item) {
          		//alert(JSON.stringify(item));
          			
          			 var unixtimestamp = item.registrationTimeStamp;

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
        			 
          			
          		var name=item.patientName;
          		var nameReplaced = name.split('_').join(' ');
          		tempLists.push(i+1,nameReplaced,item.age,item.policyId,'<a title="'+ item.walletAddress+'"href=#?'+item.walletAddress+ '>'+item.walletAddress.substr(0, 20)+'....',convdataTime,'<a  href=InitateClaimDetails.html?policyId='+item.policyId+'&patientAddress='+item.walletAddress+'&name='+name+'> Initiate Claim');
          		dataSets.push(tempLists);
          		tempLists=[];
          		});

				}
		
		
});	
	

	//alert(dataSet);
	$('#allPatients').DataTable( {
		data: dataSets,
		columns: [
			 { title: "SNo" },
		    { title: "Patient Name" },
		    {title: "Age "},
		    {title:"Policy ID"},
		    {title:"Patient Address"},
		    {title:"Registered At"},
		    {title:"Action"}
		    
		
		  
		]
		
		 });	