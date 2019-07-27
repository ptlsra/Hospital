var ipAdd=ipAddress();
var port=portNo();

var ipfsPortNo=ipfsPortNo();
var ipfsIpAddress=ipfsIpAddress();





$("#mainForm").submit(function (e) {
	e.preventDefault();
//$("#reqSubmitNew").click(function(){
	
	
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

 //patientName = patientName.replaceAll("\\s+","_");
 
 
	 var patientName=$("#soflow2").val();
	 var patientpolicyId=$("#patientpolicyId").val();
	 var dob=$("#dob").val();
	 var age=$("#age").val();
	 
	 var gender=$("#gender").val();
	 var phoneNo=$("#phoneNo").val();
	 var email=$("#email").val();
	//alert(terminalName);
	 patientName=patientName.split(' ').join('_')
	
	

	 setTimeout(function(){ 

$.ajax({
	
    dataType:"json",
    contentType: 'application/json; charset=UTF-8',
   // url:"http://"+ipAdd+":"+port+"/registerPatient?patientName="+patientName+"&dob="+dob+"&age="+age+"&gender="+gender+"&policyId="+patientpolicyId+"&emailId="+email+"&mobileNumber="+phoneNo,
   url:"/registerPatient?patientName="+patientName+"&dob="+dob+"&age="+age+"&gender="+gender+"&policyId="+patientpolicyId+"&emailId="+email+"&mobileNumber="+phoneNo,

    type:"POST",
    global:false,
    async:false, 
    success: function(result){
	//alert(result);
    	 modal.style.display = "none";
         var modal2 = document.getElementById('txModal');// Get the modal
         

         var txId=result.txId;
         if(typeof txId == undefined){
            alert("An error has occured in the transaction");
            return false;
         }
         else{
            document.getElementById("txId").innerHTML = result.txId;
            modal2.style.display = "block";
            
            setTimeout(function(){ 
                
               window.location.href="index.html";
               return false;
            }, 2000);

         }
        
 	}
 });
 	 }, 1000);

 });

