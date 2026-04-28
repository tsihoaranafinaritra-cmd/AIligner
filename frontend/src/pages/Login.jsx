import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login({ setToken, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRobotChecked, setIsRobotChecked] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isRobotChecked) {
      setError('Please confirm you are not a robot');
      return;
    }
    
    setLoading(true);
    setError('');

    setTimeout(async () => {
      try {
        const response = await axios.post('/api/login', { email, password });
        const { token, user } = response.data;
        
        setToken(token);
        setUser(user);
        
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Login failed');
        setLoading(false);
      }
    }, 3000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          flexDirection: 'column'
        }}>
          <img src="/loading.gif" alt="Loading..." style={{ width: '200px', height: 'auto' }} />
          <p style={{ color: 'white', marginTop: '20px', fontSize: '1.2rem' }}>Establishing connection...</p>
        </div>
      )}

      {/* RT.png Logo at Top Right */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10
      }}>
        <img src="/RT.png" alt="RT" style={{ height: '60px', width: 'auto' }} />
      </div>

      {/* AIligner Logo */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10
      }}>
        <img src="/Logo.png" alt="AIligner" style={{ height: '50px', width: 'auto' }} />
      </div>

      {/* Social Media Logos - Bottom Left */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '30px',
        zIndex: 10,
        display: 'flex',
        gap: '15px'
      }}>
        <a 
          href="https://www.facebook.com/labelbox.id" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '45px',
            height: '45px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            transition: 'transform 0.3s',
            backdropFilter: 'blur(5px)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="25" height="25" viewBox="0 0 24 24" fill="white">
            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z"/>
          </svg>
        </a>
        <a 
          href="https://www.instagram.com/labelboxai/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '45px',
            height: '45px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            transition: 'transform 0.3s',
            backdropFilter: 'blur(5px)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="25" height="25" viewBox="0 0 24 24" fill="white">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </a>
      </div>

      {/* About Us Button - Black */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        right: '30px',
        zIndex: 10
      }}>
        <button
          onClick={() => setShowAbout(!showAbout)}
          style={{
            background: '#000000',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 25px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ fontSize: '20px' }}>🔍</span>
          About Us
        </button>
      </div>

      {/* About Us Modal */}
      {showAbout && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '550px',
            width: '90%',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <button
              onClick={() => setShowAbout(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
            <h2 style={{ 
              color: 'white', 
              marginBottom: '25px', 
              fontSize: '28px',
              fontWeight: 'bold',
              letterSpacing: '1px'
            }}>
              About AIligner
            </h2>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ color: 'white', marginBottom: '15px', lineHeight: '1.6', fontSize: '16px' }}>
                📧 <strong>Contact:</strong> 2205112140073@paruluniversity.ac.in
              </p>
              <p style={{ color: 'white', marginBottom: '15px', lineHeight: '1.6', fontSize: '16px' }}>
                🎤 <strong>Train AI with your voice and get paid.</strong> Over 1000+ users are working with us right now!
              </p>
              <p style={{ color: 'white', marginBottom: '15px', lineHeight: '1.6', fontSize: '16px' }}>
                🤝 <strong>In corporation with LABELBOX and Alignerr.</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
              <img src="/Logo.png" alt="AIligner" style={{ height: '45px', opacity: 0.9 }} />
              <span style={{ fontSize: '28px', color: 'white', fontWeight: 'bold' }}>+</span>
              <div style={{ 
                fontSize: '22px', 
                fontWeight: 'bold', 
                color: 'white',
                background: 'rgba(255,255,255,0.2)',
                padding: '8px 15px',
                borderRadius: '10px'
              }}>
                LABELBOX
              </div>
              <span style={{ fontSize: '28px', color: 'white', fontWeight: 'bold' }}>+</span>
              <div style={{ 
                fontSize: '22px', 
                fontWeight: 'bold', 
                color: 'white',
                background: 'rgba(255,255,255,0.2)',
                padding: '8px 15px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <img src="/Alignerr.jpeg" alt="Alignerr" style={{ height: '30px', borderRadius: '5px' }} />
                Alignerr
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowPrivacy(false)}
              style={{
                position: 'sticky',
                top: '0',
                float: 'right',
                background: '#e74c3c',
                border: 'none',
                borderRadius: '50%',
                width: '35px',
                height: '35px',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
            <h1 style={{ color: '#667eea', marginBottom: '20px' }}>Terms of Use</h1>
            <p style={{ color: '#666', marginBottom: '10px' }}><strong>Effective date: September 09, 2025</strong></p>
            
            <p style={{ color: '#333', marginBottom: '15px', lineHeight: '1.6' }}>
              Welcome to AIligner. Please read on to learn the rules and restrictions that govern your use of our website(s), products, services and applications (the "Services"). If you have any questions, comments, or concerns regarding these Terms or the Services, please contact us at:
            </p>
            
            <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
              <p style={{ color: '#333', marginBottom: '5px' }}><strong>Email:</strong> 2205112140073@paruluniversity.ac.in</p>
              <p style={{ color: '#333', marginBottom: '5px' }}><strong>Phone:</strong> +91 7567404303</p>
              <p style={{ color: '#333', marginBottom: '5px' }}><strong>Address:</strong> 2261 Market St., STE 85891, San Francisco CA 94114</p>
              <p style={{ color: '#333' }}><strong>For privacy questions:</strong> privacy@alignerr.com</p>
            </div>
            
            <p style={{ color: '#333', marginBottom: '15px', lineHeight: '1.6' }}>
              These Terms of Use (the "Terms") are a binding contract between you and <strong>ALIGNERR LLC</strong> ("Alignerr," "we" and "us"). You represent and warrant that you are at least eighteen (18) years of age and have the authority and capacity to agree to these Terms. Your use of the Services in any way means that you agree to all of these Terms, and these Terms will remain in effect while you use the Services. These Terms include the provisions in this document as well as those in the Privacy Policy, and Copyright Dispute Policy. Your use of or participation in certain Services may also be subject to additional policies, rules and/or conditions ("Additional Terms"), which are incorporated herein by reference, and you understand and agree that by using or participating in any such Services, you agree to also comply with these Additional Terms.
            </p>
            
            <p style={{ color: '#333', marginBottom: '15px', lineHeight: '1.6' }}>
              Please read these Terms carefully. They cover important information about Services provided to you. These Terms include information about future changes to these Terms, limitations of liability, a class action waiver and resolution of disputes by arbitration instead of in court. <strong>PLEASE NOTE THAT YOUR USE OF AND ACCESS TO OUR SERVICES ARE SUBJECT TO THE FOLLOWING TERMS; IF YOU DO NOT AGREE TO ALL OF THE FOLLOWING, YOU MAY NOT USE OR ACCESS THE SERVICES IN ANY MANNER.</strong>
            </p>
            
            <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '10px', marginBottom: '20px', borderLeft: '4px solid #ffc107' }}>
              <p style={{ color: '#856404', marginBottom: '0' }}>
                <strong>ARBITRATION NOTICE AND CLASS ACTION WAIVER:</strong> EXCEPT FOR CERTAIN TYPES OF DISPUTES DESCRIBED IN THE ARBITRATION AGREEMENT SECTION BELOW, YOU AGREE THAT DISPUTES BETWEEN YOU AND US WILL BE RESOLVED BY BINDING, INDIVIDUAL ARBITRATION AND YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.
              </p>
            </div>
            
            <button
              onClick={() => setShowPrivacy(false)}
              className="btn-primary"
              style={{ marginTop: '20px', width: '100%' }}
            >
              I Agree
            </button>
          </div>
        </div>
      )}

      <div className="glass fade-in" style={{
        maxWidth: '450px',
        width: '100%',
        padding: '40px',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
          <img src="/brain.png" alt="Brain" style={{ height: '40px', width: 'auto' }} />
          <h1 style={{ color: 'white', fontSize: '2.5rem', margin: 0 }}>AIligner</h1>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: '30px' }}>
          AI Training Platform
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="robotCheck"
              checked={isRobotChecked}
              onChange={(e) => setIsRobotChecked(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <label htmlFor="robotCheck" style={{ color: 'white', margin: 0, cursor: 'pointer' }}>
              I am not a robot
            </label>
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
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/signup')}
            >
              Don't have an account? Sign Up
            </button>
          </div>
        </form>

        {/* Privacy Policy Link */}
        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button
            onClick={() => setShowPrivacy(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Terms of Privacy
          </button>
        </div>

        {/* Trust Pilot Logo and Stars */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          <img src="/trust.png" alt="Trust Pilot" style={{ height: '40px', width: 'auto', marginBottom: '8px' }} />
          <div style={{
            display: 'flex',
            gap: '5px',
            justifyContent: 'center'
          }}>
            <span style={{ color: '#ffd700', fontSize: '18px' }}>★</span>
            <span style={{ color: '#ffd700', fontSize: '18px' }}>★</span>
            <span style={{ color: '#ffd700', fontSize: '18px' }}>★</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px' }}>★</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px' }}>★</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '5px' }}>
            Trusted by 1000+ users
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;