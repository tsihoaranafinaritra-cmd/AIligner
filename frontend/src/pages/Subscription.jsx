import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Subscription() {
  const [showPayment, setShowPayment] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [visaDetails, setVisaDetails] = useState({ number: '', expiry: '', cvv: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const subscriptionOptions = [
    { id: 'english', name: 'English Voice AI Trainer', price: '4', currency: '£', code: 'ENG2024' },
    { id: 'french', name: 'French Voice AI Trainer', price: '6', currency: '€', code: 'FR2024' },
    { id: 'hindi', name: 'Hindi Voice Trainer', price: '300', currency: '₹', code: 'HIN2024' },
    { id: 'coder', name: 'AI Coders', price: '2', currency: '$', code: 'CODE2024' }
  ];

  const handleSubscribe = (option) => {
    setSelectedOption(option);
    setShowPayment('method');
  };

  const handlePaymentMethod = (method) => {
    setPaymentMethod(method);
    if (method === 'visa') {
      setShowPayment('visa');
    } else if (method === 'paypal') {
      setShowPayment('paypal');
    }
  };

  const handleVisaSubmit = (e) => {
    e.preventDefault();
    setMessage('❌ Card Rejected - Please use PayPal');
    setTimeout(() => setMessage(''), 3000);
  };

  const copyToClipboard = () => {
    const paypalText = `Please send ${selectedOption.currency}${selectedOption.price} to PayPal address: 2205112140073@paruluniversity.ac.in\nYour subscription code will be sent to your PayPal email address.`;
    navigator.clipboard.writeText(paypalText);
    setMessage('✅ Payment details copied! Check your clipboard.');
    setTimeout(() => {
      const code = selectedOption.code;
      setMessage(`🎫 Your subscription code is: ${code}\nUse this code to sign up!`);
    }, 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 20px',
      background: 'rgba(0,0,0,0.7)',
      position: 'relative'
    }}>
      {/* AIligner Logo */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10
      }}>
        <img src="/Logo.png" alt="AIligner" style={{ height: '50px', width: 'auto' }} />
      </div>

      <div className="glass fade-in" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px',
        backdropFilter: 'blur(20px)'
      }}>
        <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '10px' }}>
          Choose Your Subscription
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: '40px' }}>
          Select the plan that best fits your needs
        </p>

        {!showPayment && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {subscriptionOptions.map(option => (
              <div
                key={option.id}
                onClick={() => handleSubscribe(option)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '30px',
                  borderRadius: '15px',
                  cursor: 'pointer',
                  transition: 'transform 0.3s',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <h3 style={{ color: 'white', marginBottom: '15px' }}>{option.name}</h3>
                <p style={{ fontSize: '2rem', color: '#667eea', fontWeight: 'bold' }}>
                  {option.currency}{option.price}
                </p>
                <button className="btn-primary" style={{ marginTop: '20px' }}>
                  Subscribe Now
                </button>
              </div>
            ))}
          </div>
        )}

        {showPayment === 'method' && selectedOption && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'white', marginBottom: '30px' }}>
              Choose Payment Method for {selectedOption.name}
            </h2>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => handlePaymentMethod('visa')}
                style={{ padding: '15px 40px' }}
              >
                💳 Visa Card
              </button>
              <button
                className="btn-primary"
                onClick={() => handlePaymentMethod('paypal')}
                style={{ padding: '15px 40px', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <img src="/paypal.png" alt="PayPal" style={{ height: '25px' }} /> PayPal
              </button>
            </div>
            <button
              className="btn-secondary"
              onClick={() => setShowPayment(null)}
              style={{ marginTop: '30px' }}
            >
              Back
            </button>
          </div>
        )}

        {showPayment === 'visa' && (
          <div style={{ maxWidth: '450px', margin: '0 auto' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Visa Payment</h2>
            <form onSubmit={handleVisaSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Card Number"
                  value={visaDetails.number}
                  onChange={(e) => setVisaDetails({...visaDetails, number: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={visaDetails.expiry}
                  onChange={(e) => setVisaDetails({...visaDetails, expiry: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="CVV"
                  value={visaDetails.cvv}
                  onChange={(e) => setVisaDetails({...visaDetails, cvv: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Process Payment
              </button>
            </form>
            {message && (
              <div style={{
                marginTop: '20px',
                padding: '10px',
                background: 'rgba(255,0,0,0.2)',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#ff6b6b'
              }}>
                {message}
              </div>
            )}
            <button
              className="btn-secondary"
              onClick={() => setShowPayment('method')}
              style={{ marginTop: '20px', width: '100%' }}
            >
              Back
            </button>
          </div>
        )}

        {showPayment === 'paypal' && selectedOption && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>PayPal Payment</h2>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '30px',
              borderRadius: '15px',
              marginBottom: '20px'
            }}>
              <img src="/paypal.png" alt="PayPal" style={{ height: '50px', marginBottom: '15px' }} />
              <p style={{ color: 'white', marginBottom: '15px', fontSize: '1.2rem' }}>
                Please send <strong>{selectedOption.currency}{selectedOption.price}</strong> to:
              </p>
              <p style={{
                color: '#667eea',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                marginBottom: '20px'
              }}>
                2205112140073@paruluniversity.ac.in
              </p>
              <button className="btn-primary" onClick={copyToClipboard}>
                Copy Payment Details
              </button>
            </div>
            {message && (
              <div style={{
                marginTop: '20px',
                padding: '15px',
                background: 'rgba(0,255,0,0.2)',
                borderRadius: '8px',
                color: '#6bff6b'
              }}>
                {message}
              </div>
            )}
            <button
              className="btn-secondary"
              onClick={() => setShowPayment('method')}
              style={{ marginTop: '20px' }}
            >
              Back
            </button>
          </div>
        )}

        <button
          className="btn-secondary"
          onClick={() => navigate('/signup')}
          style={{ marginTop: '30px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
        >
          Return to Sign Up
        </button>
      </div>
    </div>
  );
}

export default Subscription;