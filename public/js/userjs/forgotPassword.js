const err = document.getElementById('nameerr1');

async function checkEmail() {
  err.innerHTML = ''; //clearing previous err

  const email = document.getElementById('email').value;

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (regex.test(email)) {
    //area disable for preventing submit again
    document.getElementById('emailCheck').disabled = 'disabled';
    document.getElementById('email').disabled = 'disabled';

    const response = await fetch('/verifyEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      Swal.fire({
        title: 'OTP Sended sucessfull!',
        text: 'Check Your email!',
        icon: 'success',
      });

      //enable otp field
      getOtpField();
      timer();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Check you Email',
      });

      // enabling disanled button
      document.getElementById('emailCheck').disabled = '';
      document.getElementById('email').disabled = '';
    }
  } else {
    err.innerHTML = 'Enter a Valid Email';
  }
}

// resent timer
const countdown = document.getElementById('countdown');
const resendBtn = document.getElementById('resendBtn');

function timer() {
  let decCounter = 60;
  const counter = setInterval(() => {
    decCounter--;
    countdown.innerHTML = `00:${decCounter}`;
    if (decCounter == 0) {
      clearInterval(counter);
      resendBtn.classList.remove('disabled');
    }
  }, 1000);
}

// showing otp field
function getOtpField() {
  document.getElementById('otpSection').classList.toggle('d-none');
  document.getElementById('emailCheck').classList.toggle('d-none');
}

//otp verification
async function verifyOtp() {
  const userOtp = document.getElementById('userOtp').value;

  const response = await fetch('/verifyOtp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userOtp }),
  });

  if (response.ok) {
    Swal.fire({
      title: 'OTP Verified sucessfull!',
      text: 'continue To chnage Password',
      icon: 'success',
    });

    document.getElementById('topSection').classList.add('d-none');
    document.getElementById('passwordSection').classList.remove('d-none');
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Invalid OTP',
      text: 'Please Try Again',
    });

    
  }
}

//password validating
function validate() {
  const password = document.getElementById('password1').value;
  const cPassword = document.getElementById('password2').value;
  document.getElementById('passwordError').innerHTML = '';

  let validation = true;

  if (password !== cPassword) {
    return (document.getElementById('passwordError').innerHTML =
      'confirm password not match ');
    validation = false;
  }

  const passwordPattern =
    /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordPattern.test(password)) {
    document.getElementById('passwordError').innerHTML =
      'Password must be at least 8 characters long and contain at least one letter and one number.';
    validation = false;
  }

  if(validation){
    changePassword(password);
  }

}

//changing request
async function changePassword(password){

  const response = await fetch('/changePassword',{method:"POST",
    headers:{
      "Content-Type":'application/json'
    },
    body:JSON.stringify({password})
  });

  if(response.ok){

    await Swal.fire({
      title: "Password Changed Sucessfully!",
      text: "You continue with new password!",
      icon: "success"
    });

    window.location.href = '/login'

  }else{
    Swal.fire({
      icon: 'error',
      title: 'Something went Wrong',
      text: 'Please Try Again',
    });
  }



}
