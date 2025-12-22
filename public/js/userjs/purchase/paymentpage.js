const payNowBtn = document.getElementById('payNowBtn');

payNowBtn.addEventListener('click', initatePayment)

const razorpayOrderId = payNowBtn.getAttribute('razorpayOrderId')
const finalAmount = payNowBtn.getAttribute('finalAmount')
const razorpayKey = payNowBtn.getAttribute('razorpayKey')

async function initatePayment(event) {

    event.preventDefault();

    const options = {
        "key": razorpayKey,
        "amount": finalAmount,
        "currency": "INR",
        "name": "Your Company Name",
        "description": "Test Transaction",
        "order_id": razorpayOrderId,
        "redirect": true,
        "callback_url": `${window.location.origin}/payment/callback`

    };

    const rzp1 = await new Razorpay(options);

    rzp1.open();

}

