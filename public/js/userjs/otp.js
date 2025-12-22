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

timer();


resendBtn.addEventListener('click', () => {

    fetch('/resentotp', { method: 'GET', })
        .then((result) => {

            Swal.fire({
                title: 'OTP Sent!',
                text: 'Check your email for the OTP.',
                icon: 'success',
                confirmButtonText: 'OK',
            });
            console.log(result);


        }).catch((e) => {
            console.log(e)
            alert('somthing wrong', e)
        })

    resendBtn.classList.add('disabled');

    timer();
});





// otp verify
const verifyOtp = async () => {
    const enteredOtp = document.getElementById('userOtp').value;


    const response = await fetch('/verify-otp', {
        method: 'post',
        body: JSON.stringify({ enteredOtp })
        , headers: {
            'Content-Type': 'application/json'
        }
    });


    if (response.ok) {

        await Swal.fire({
            title: 'Sucessfull',
            text: 'Account Created SucessFull',
            icon: 'success',
            confirmButtonText: 'OK',
        });

        window.location.href = '/home'



    } else {

        Swal.fire({
            icon: "error",
            title: "Wrong OTP",
            text: "Please try again",
            confirmButtonText: 'OK',
        });

    }

}


