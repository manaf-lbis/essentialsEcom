function getEdit() {
    const nameInput = document.getElementById('name');
    const dobInput = document.getElementById('dateOfBirth');
    const maleInput = document.getElementById('male');
    const femaleInput = document.getElementById('female');
    const phoneInput = document.getElementById('phone');
    const editBtn = document.getElementById('editBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Toggle the disabled property for each input
    const isDisabled = nameInput.disabled;

    nameInput.disabled = !isDisabled;
    dobInput.disabled = !isDisabled;
    maleInput.disabled = !isDisabled;
    femaleInput.disabled = !isDisabled;
    phoneInput.disabled = !isDisabled;

    // Toggle the visibility of the buttons
    editBtn.hidden = !editBtn.hidden
    submitBtn.hidden =  !submitBtn.hidden
}

const submitBtn = document.getElementById('submitBtn');

function clearErr() {
    document.getElementById('phoneerr').innerHTML = '';
    document.getElementById('gendererr').innerHTML = '';
    document.getElementById('doberr').innerHTML = '';
    document.getElementById('nameerr').innerHTML = '';
}

submitBtn.addEventListener('click', () => {

    clearErr();//clear default err

    const name = document.getElementById('name').value;
    const dateOfBirth = document.getElementById('dateOfBirth').value;

    let gender = false;

    if (document.getElementById('male').checked) {
        gender = 'male';
    } else if (document.getElementById('female').checked) {
        gender = 'female';
    }

    const phone = document.getElementById('phone').value;

    let validation = true;

    // validate
    if (Number(phone) < 5999999999 || Number(phone) > 10000000000) {
        document.getElementById('phoneerr').innerHTML =
            ' Enter a valid Mobile Number';
        validation = false;
    }

    if (!gender) {
        document.getElementById('gendererr').innerHTML = ' Cheese your gender';
        validation = false;
    }

    if (!dateOfBirth  ) {
            document.getElementById('doberr').innerHTML =
                ' Enter a valid Dare of Birth';
            validation = false;
    }

    const birthDate = new Date(dateOfBirth);
    const limitDate = new Date('2018-01-01');

    if (birthDate >= limitDate) {
        document.getElementById('doberr').innerHTML = "You must select a date before January 1, 2018.";
        return false;
      }
   



    if (name.trim().length < 3) {
        document.getElementById('nameerr').innerHTML = 'name should be minimum 3';
        validation = false;
    }

    if(validation){
        submitForm(name,dateOfBirth,gender,phone);
    }
});


async function submitForm(name,dateOfBirth,gender,phone){

   const _id =  document.getElementById('_id').value;
   try {

    const response = await fetch('/updateUser',{
        method:"Post",
        headers:{
            'content-Type':'application/json'
        },
        body:JSON.stringify({name,dateOfBirth,gender,phone,_id})
    });

    if(response.ok){
        Swal.fire({
            title: "Sucess",
            text: "You Data Updated Sucessfully!",
            icon: "success"
          });
          getEdit()
    }else{
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Something went wrong!",
          });
          getEdit()
    }
    
   } catch (error) {

    console.log(error);
    
    Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
      getEdit()

   }


}