// frontend/src/components/Checkout.js
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
  const { cart } = useContext(CartContext);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [order, setOrder] = useState(null);
  const history = useNavigate();

  const createOrder = async () => {
    try {
      const items = cart.map(item => ({ id: item._id, quantity: item.quantity }));
      const response = await axios.post('/api/orders', { items, deliveryAddress }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setOrder(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePayment = () => {
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: order.totalAmount * 100, // Convert to paise
      currency: 'INR',
      name: 'Food Ordering',
      description: 'Order Payment',
      order_id: order.razorpayOrderId,
      handler: function (response) {
        axios.post('/api/payment/verify-payment', response)
          .then((res) => {
            if (res.data.success) {
              history.push('/success');
            } else {
              history.push('/cancel');
            }
          })
          .catch((error) => console.error(error));
      },
      prefill: {
        name: 'Customer Name',
        email: 'customer@example.com',
        contact: '9999999999',
      },
      theme: {
        color: '#3399cc',
      },
    };
    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      alert('Payment failed: ' + response.error.description);
      history.push('/cancel');
    });
    razorpay.open();
  };

  return (
    <div>
      <h2>Checkout</h2>
      <input
        type="text"
        value={deliveryAddress}
        onChange={(e) => setDeliveryAddress(e.target.value)}
        placeholder="Delivery Address"
        required
      />
      <button onClick={createOrder}>Create Order</button>
      {order && <button onClick={handlePayment}>Pay with Razorpay</button>}
    </div>
  );
};

export default Checkout;