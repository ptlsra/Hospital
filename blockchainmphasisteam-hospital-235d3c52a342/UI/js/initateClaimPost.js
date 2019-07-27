var ipAdd=ipAddress();
var port=portNo();

var ipfsPortNo=ipfsPortNo();
var ipfsIpAddress=ipfsIpAddress();



//$("#reqSubmit").click(function(){
    
    
$("#initiateClaimForm").submit(function (e) {
	e.preventDefault();
	
	var modal = document.getElementById('myModal');// Get the modal
	  
   	var span = document.getElementsByClassName("close")[0];
   	
 // When the user clicks on the button, open the modal
 
   
   	 modal.style.display = "block";
   
 

 // When the user clicks on <span> (x), close the modal
 span.onclick = function() {
     modal.style.display = "none";
 }

 // When the user clicks anywhere outside of the modal, close it
 window.onclick = function(event) {
     if (event.target == modal) {
         modal.style.display = "none";
     }
 } 

	 var hospitalAddress=$("#hospitalAddress").val();
	 var patientAddress=$("#patientAddress").val();
	 var policyId=$("#patientPolicyId").val();
	 var insClaimEst=$("#insClaimEst").val();
	//alert(terminalName);
	 
	 claimEst=parseInt(insClaimEst);
	

	 setTimeout(function(){ 

$.ajax({
	
    dataType:"json",
    contentType: 'application/json; charset=UTF-8',
    url:"/initiateClaim?patientAddress="+patientAddress+"&policyId="+policyId+"&hospitalAddress="+hospitalAddress+"&claimEstimate="+claimEst,		

    type:"POST",
    global:false,
    async:false, 
    success: function(result){
	//alert(result);
    	 modal.style.display = "none";
    	 var modal2 = document.getElementById('txModal');// Get the modal
        document.getElementById("txId").innerHTML = result.txId;
        modal2.style.display = "block";
        
        setTimeout(function(){ 
            
           window.location.href="index.html";
           return false;
        }, 2000);
 	}
 });
 	 }, 1000);

 });

