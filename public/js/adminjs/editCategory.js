const submitBtn = document.getElementById('submitBtn');

//clear errmsg
function clearErr(){
    document.getElementById('categoryErr').innerHTML = '';
    document.getElementById('descriptionErr').innerHTML = ''
}



submitBtn.addEventListener('click', (event) => {
    event.preventDefault();

    clearErr()//clear previous err;

    const categoryName = document.getElementById('categoryName').value;
    const description = document.getElementById('description').value;
    const form = document.getElementById('form');
    
    let validation = true;


    if (categoryName.trim().length < 4) {
        document.getElementById('categoryErr').innerHTML = 'invalid category Name';
        validation = false;
    };

    if (description.trim().length <= 10) {
        document.getElementById('descriptionErr').innerHTML = 'Add  a description '
        validation = false;
    };

    if (validation) {
        form.submit();
    }

});




