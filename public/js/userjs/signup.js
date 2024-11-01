const form  = document.getElementById('form');



form.addEventListener("submit",(event)=>{
   event.preventDefault();

   clearError();

   const name =  document.getElementById('nameField').value;
   const email = document.getElementById('emailField').value;
   const phone = document.getElementById('phoneField').value;
   const password = document.getElementById('passwordField').value;

   let validation = true;

   if(name.trim().length < 3){
    document.getElementById('nameField').value = ''
    document.getElementById('nameerr').innerHTML = 'name should be minimum 3';
    validation = false;
   }

   const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!email || !emailPattern.test(email)) {
    validation = false;
    document.getElementById('emailerr').innerHTML = 'Valid email is required.'; // Show error message
   }


   if(Number(phone) < 5999999999 || Number(phone) > 10000000000 ){
    document.getElementById('phoneerr').innerHTML = 'Enter a valid Mobile Number';
    validation = false;
   }

   const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
   if(!passwordPattern.test(password) ){
    document.getElementById('passworderr').innerHTML = 'Password must be at least 8 characters long and contain at least one letter and one number.';
    validation = false;
   }

   
function clearError(){
    document.getElementById('nameerr').innerHTML ='';
    document.getElementById('phoneerr').innerHTML ='';
    document.getElementById('emailerr').innerHTML ='';
    document.getElementById('passworderr').innerHTML ='';
}


if(validation){
    form.submit(); 
}
   
    
});
