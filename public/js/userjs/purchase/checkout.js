document.addEventListener("DOMContentLoaded", () => {
    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", (event) => {
            if (!validateCheckoutForm()) {
                event.preventDefault();
            }
        });
    }
});

function validateCheckoutForm() {
    const selectedAddress = document.querySelector('input[name="deliveryAddress"]:checked');
    const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked');

    if (!selectedAddress) {
        ErrorToast("Please Choose an Address to proceed!");
        return false;
    }

    if (!selectedPaymentMethod) {
        ErrorToast("Please Choose a Payment Method to proceed!");
        return false;
    }

    return true;
}

const newAddressSubmit = document.getElementById('newAddressSubmit');
const addressAddingForm = document.getElementById('addressAddingForm');

function clearAllField() {
    document.getElementById('fullName').value = ''
    document.getElementById('houseName').value = ""
    document.getElementById('area').value = ""
    document.getElementById('street').value = ""
    document.getElementById('city').value = ""
    document.getElementById('state').value = ""
    document.getElementById('pincode').value = ""
    document.getElementById('phone').value = ""
}

function clearAllErr() {
    document.getElementById('fullNameErr').innerText = "";
    document.getElementById('houseNameErr').innerText = "";
    document.getElementById('areaErr').innerText = "";
    document.getElementById('streetErr').innerText = "";
    document.getElementById('cityErr').innerText = "";
    document.getElementById('stateErr').innerText = "";
    document.getElementById('pincodeErr').innerText = "";
    document.getElementById('phoneErr').innerText = "";
}

function validateForm() {
    let fullName = document.getElementById('fullName').value.trim();
    let houseName = document.getElementById('houseName').value.trim();
    let area = document.getElementById('area').value.trim();
    let street = document.getElementById('street').value.trim();
    let city = document.getElementById('city').value.trim();
    let state = document.getElementById('state').value.trim();
    let pincode = document.getElementById('pincode').value.trim();
    let phone = document.getElementById('phone').value.trim();

    let isValid = true;
    clearAllErr()

    if (fullName === "") {
        document.getElementById('fullNameErr').innerText = "Full Name is required.";
        isValid = false;
    }
    if (houseName === "") {
        document.getElementById('houseNameErr').innerText = "Address is required.";
        isValid = false;
    }
    if (area === "") {
        document.getElementById('areaErr').innerText = "Area is required.";
        isValid = false;
    }
    if (street === "") {
        document.getElementById('streetErr').innerText = "Street is required.";
        isValid = false;
    }
    if (city === "") {
        document.getElementById('cityErr').innerText = "City is required.";
        isValid = false;
    }
    if (state === "") {
        document.getElementById('stateErr').innerText = "State is required.";
        isValid = false;
    }
    if (pincode === "") {
        document.getElementById('pincodeErr').innerText = "Postal code is required.";
        isValid = false;
    } else if (!/^\d{6}$/.test(pincode)) {
        document.getElementById('pincodeErr').innerText = "Postal code must be 6 digits.";
        isValid = false;
    }
    if (phone === "") {
        document.getElementById('phoneErr').innerText = "Phone number is required.";
        isValid = false;
    } else if (!/^\d{10}$/.test(phone)) {
        document.getElementById('phoneErr').innerText = "Phone number must be 10 digits.";
        isValid = false;
    }
    return isValid;
}

if (newAddressSubmit) {
    newAddressSubmit.addEventListener('click', (event) => {
        event.preventDefault();
        const validation = validateForm();
        if (validation) {
            addressAddingForm.submit()
        }
    })
}

const deleteIcon = document.querySelectorAll('.deleteBtn');
deleteIcon.forEach((icon) => {
    icon.addEventListener('click', deleteClicked)
})

async function deleteClicked(e) {
    const _id = e.currentTarget.getAttribute('addressId')
    const result = await ConfirmAction(
        "Are you sure?",
        "You won't be able to revert this!",
        "Yes, delete it!"
    );
    if (result.isConfirmed) {
        sentRequest(_id);
    }
}

async function sentRequest(_id) {
    const response = await fetch(`/removeAddress?_id=${_id}`, {
        method: "GET",
        headers: {
            'content-type': 'application/json'
        },
    })
    if (response.ok) {
        SuccessToast("Address Deleted Successfully");
        setTimeout(() => {
            window.location.href = window.location.pathname;
        }, 1000);
    } else {
        ErrorToast("Internal server error");
    }
}

const editBtn = document.querySelectorAll('.editBtn');
editBtn.forEach((icon) => {
    icon.addEventListener('click', editBtnClicked)
})

async function editBtnClicked(event) {
    event.preventDefault();
    clearAllErr()
    clearAllField()
    const _id = event.currentTarget.getAttribute('addressId')
    const response = await fetch(`/addressDataForEdit/?addressId=${_id}`, {
        method: 'get',
        headers: {
            'content-type': 'application/json'
        }
    });
    const data = await response.json();
    $('#exampleModalCenter').modal('show');
    document.getElementById('fullName').value = data.address[0].fullName
    document.getElementById('houseName').value = data.address[0].houseName
    document.getElementById('area').value = data.address[0].area
    document.getElementById('street').value = data.address[0].street
    document.getElementById('city').value = data.address[0].city
    document.getElementById('state').value = data.address[0].state
    document.getElementById('pincode').value = data.address[0].pincode
    document.getElementById('phone').value = data.address[0].phone
    document.getElementById('defaultAddress').checked = data.address[0]?.defaultAddress
    document.getElementById('hiddenId').value = data.address[0]._id
    document.getElementById('newAddressSubmit').innerHTML = 'Save Changes';
    document.getElementById('addressAddingForm').setAttribute('action', '/updateAddress')
}

const quantitySelection = document.querySelectorAll('.quantitySelection');
quantitySelection.forEach((ele) => {
    ele.addEventListener('change', checkQuantity)
})

async function checkQuantity(event) {
    let qty = event.target.value
    const _id = event.target.getAttribute('productid');
    if (qty >= 5) {
        ErrorToast("Max qty reached");
        qty = 5;
        event.target.value = 5;
    }
    const response = await fetch(`/checkProductQty/?qty=${qty}&_id=${_id}`, {
        method: 'GET',
        headers: {
            'content-Type': 'application/json'
        }
    })
    const json = await response.json()
    if (!response.ok) {
        event.target.value = json.availableQty;
        ErrorToast("Out of Stock");
    }
}
