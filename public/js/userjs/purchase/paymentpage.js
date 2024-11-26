
const payNowBtn = document.getElementById('payNowBtn');

payNowBtn.addEventListener('click', initatePayment)

const razorpayOrderId = payNowBtn.getAttribute('razorpayOrderId')
const finalAmount = payNowBtn.getAttribute('finalAmount')
const razorpayKey = payNowBtn.getAttribute('razorpayKey')




async function initatePayment(event) {

    event.preventDefault();

    // Razorpay options with callback URL
    const options = {
        "key": razorpayKey, // Replace with your Razorpay Key ID
        "amount": finalAmount, // in paise
        "currency": "INR",
        "name": "Your Company Name",
        "description": "Test Transaction",
        "order_id": razorpayOrderId, // Order ID from the server
        "redirect": true, // Enables redirect on payment completion
        "callback_url": "http://essentialsecom.shop/payment/callback" // Your server's callback URL
    };

    // Initialize Razorpay instance
    const rzp1 = await new Razorpay(options);


    rzp1.open();



}

