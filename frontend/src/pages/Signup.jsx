import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    gender: '',
    password: '',
    subscription_code: ''
  });
  const [passportPhoto, setPassportPhoto] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setPassportPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('gender', formData.gender);
    data.append('password', formData.password);
    data.append('subscription_code', formData.subscription_code);
    if (passportPhoto) {
      data.append('passport_photo', passportPhoto);
    }

    try {
      const response = await axios.post('/api/signup', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/user');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
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
        maxWidth: '550px',
        width: '100%',
        padding: '40px',
        backdropFilter: 'blur(20px)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '30px' }}>
          Create Account
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label>Passport Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              style={{ padding: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="transgender">Transgender</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Subscription Code</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                name="subscription_code"
                value={formData.subscription_code}
                onChange={handleChange}
                placeholder="Enter your subscription code"
                style={{ flex: 1 }}
                required
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/subscription')}
              >
                Get Code
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,0,0,0.2)',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#ff6b6b',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/login')}
            >
              Already have an account? Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;