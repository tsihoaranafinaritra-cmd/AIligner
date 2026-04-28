import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function UserPage({ token, user }) {
  const [activeTab, setActiveTab] = useState(0);
  const [jobs, setJobs] = useState({});
  const [tasks, setTasks] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [messages, setMessages] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [withdrawDetails, setWithdrawDetails] = useState({});
  const [withdrawing, setWithdrawing] = useState(false);
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  // Get currency based on subscription type
  const getCurrency = () => {
    switch(userInfo?.subscription_type) {
      case 'english': return { symbol: '£', name: 'Pounds' };
      case 'french': return { symbol: '€', name: 'Euros' };
      case 'hindi': return { symbol: '₹', name: 'Rupees' };
      case 'coder': return { symbol: '$', name: 'Dollars' };
      default: return { symbol: '$', name: 'Dollars' };
    }
  };

  // Get flag based on subscription type
  const getFlag = () => {
    switch(userInfo?.subscription_type) {
      case 'english': return '/UK.jpg';
      case 'french': return '/FR.jpeg';
      case 'hindi': return '/INDIA.jpg';
      case 'coder': return '/CODE.jpg';
      default: return null;
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        const jobsRes = await api.get('/jobs');
        setJobs(jobsRes.data);
        const examsRes = await api.get('/my-exams');
        setExams(examsRes.data);
      } else if (activeTab === 1) {
        const tasksRes = await api.get('/tasks');
        setTasks(tasksRes.data);
        const examsRes = await api.get('/my-exams');
        setExams(examsRes.data);
      } else if (activeTab === 2) {
        const profileRes = await api.get('/user/profile');
        setUserInfo(profileRes.data);
        const messagesRes = await api.get('/messages');
        setMessages(messagesRes.data);
      } else if (activeTab === 3) {
        const profileRes = await api.get('/user/profile');
        setUserInfo(profileRes.data);
        const withdrawalsRes = await api.get('/withdrawals');
        setWithdrawals(withdrawalsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyForJob = async (jobType) => {
    const existingExam = exams.find(e => e.exam_type === jobType);
    if (existingExam && existingExam.status === 'passed') {
      alert('You have already passed this exam and can work!');
      return;
    }
    if (existingExam && existingExam.status === 'pending') {
      alert('Your exam is pending admin review. Please wait.');
      return;
    }
    if (existingExam && existingExam.status === 'failed') {
      alert('You have failed this exam and cannot retake it.');
      return;
    }
    
    try {
      const response = await api.post('/apply-job', { jobType });
      navigate(`/exam/${jobType}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Cannot apply for this job');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    if (!withdrawMethod) {
      alert('Please select a withdrawal method');
      return;
    }
    
    const currency = getCurrency();
    const totalAmount = userInfo?.total_earned || 0;
    
    if (totalAmount <= 0) {
      alert('You have no balance to withdraw');
      return;
    }
    
    const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending');
    if (hasPendingWithdrawal) {
      alert('You already have a pending withdrawal request. Please wait for admin to process it.');
      return;
    }
    
    const confirmWithdraw = window.confirm(
      `⚠️ WARNING: You are about to withdraw your ENTIRE BALANCE of ${currency.symbol}${totalAmount} ${currency.name}.\n\n` +
      `This amount will be IMMEDIATELY DEDUCTED from your balance.\n\n` +
      `If the admin rejects your request, the amount will be refunded.\n\n` +
      `Do you want to continue?`
    );
    
    if (!confirmWithdraw) return;
    
    setWithdrawing(true);
    
    try {
      const response = await api.post('/withdraw', {
        amount: totalAmount,
        method: withdrawMethod,
        details: withdrawDetails
      });
      
      alert(`✅ Withdrawal request submitted!\n\n${currency.symbol}${totalAmount} has been deducted from your balance.\n\nIf rejected by admin, it will be refunded.`);
      
      const profileRes = await api.get('/user/profile');
      setUserInfo(profileRes.data);
      
      fetchData();
      setWithdrawMethod('');
      setWithdrawDetails({});
    } catch (error) {
      alert(error.response?.data?.error || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'in_progress': '#ffa500',
      'submitted': '#3498db',
      'rejected': '#e74c3c',
      'paid': '#2ecc71',
      'pending': '#f39c12',
      'passed': '#2ecc71',
      'failed': '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  const getExamStatusText = (status) => {
    switch(status) {
      case 'pending': return '⏳ Waiting for Admin Validation';
      case 'passed': return '✅ Validated - You can work!';
      case 'failed': return '❌ Failed - Cannot retake';
      default: return '📝 Not Taken Yet';
    }
  };

  const currency = userInfo ? getCurrency() : { symbol: '$', name: 'Dollars' };
  const flag = getFlag();
  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending');
  const currentBalance = userInfo?.total_earned || 0;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundImage: `url('/USER.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      padding: '20px', 
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

      <div className="glass fade-in" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', marginTop: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src="/hat.png" alt="Profile" style={{ height: '30px', width: 'auto' }} />
            <h1 style={{ color: 'white' }}>Welcome, {user?.email}</h1>
            {flag && (
              <img src={flag} alt="Subscription Flag" style={{ height: '30px', width: 'auto', opacity: 0.8, borderRadius: '5px' }} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/exit.png" alt="Exit" style={{ height: '25px', width: 'auto' }} />
            <button 
              className="btn-secondary" 
              onClick={() => {
                localStorage.clear();
                navigate('/login');
              }}
              style={{ background: '#e74c3c', borderColor: '#e74c3c' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#c0392b'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#e74c3c'}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {['Job Listings', 'Working Sheet', 'User Information', 'Withdrawal'].map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              style={{
                padding: '12px 25px',
                background: activeTab === index ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '25px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab 0: Job Listings with Flags */}
        {activeTab === 0 && (
          <div>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Available Jobs</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              {Object.entries(jobs).map(([key, job]) => {
                const userExam = exams.find(e => e.exam_type === key);
                const isEligible = userExam?.status === 'passed';
                const isPending = userExam?.status === 'pending';
                const isFailed = userExam?.status === 'failed';
                
                let flagSrc = '';
                if (key === 'english') flagSrc = '/UK.jpg';
                else if (key === 'french') flagSrc = '/FR.jpeg';
                else if (key === 'hindi') flagSrc = '/INDIA.jpg';
                else if (key === 'coder') flagSrc = '/CODE.jpg';
                
                return (
                  <div key={key} style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '20px',
                    borderRadius: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {flagSrc && (
                        <img src={flagSrc} alt={key} style={{ height: '40px', width: 'auto', opacity: 0.66, borderRadius: '5px' }} />
                      )}
                      <div>
                        <h3 style={{ color: 'white' }}>{job.title}</h3>
                        <p style={{ color: '#667eea', fontSize: '1.2rem', fontWeight: 'bold' }}>{job.salary}</p>
                        {isPending && <p style={{ color: '#f39c12', fontSize: '0.85rem' }}>⏳ Exam pending validation</p>}
                        {isFailed && <p style={{ color: '#e74c3c', fontSize: '0.85rem' }}>❌ Exam failed - Cannot apply</p>}
                        {isEligible && <p style={{ color: '#2ecc71', fontSize: '0.85rem' }}>✅ Exam validated - You can work!</p>}
                      </div>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => applyForJob(key)}
                      disabled={isPending || isFailed}
                      style={{
                        opacity: (isPending || isFailed) ? 0.5 : 1,
                        cursor: (isPending || isFailed) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isPending ? 'Pending Validation' : isFailed ? 'Failed' : 'Apply Now'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 1: Working Sheet */}
        {activeTab === 1 && (
          <div>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Working Sheet</h2>
            
            {/* Exam Status Section with icon */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '25px',
              borderRadius: '15px',
              marginBottom: '30px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <img src="/Exam.png" alt="Exam" style={{ height: '30px', width: 'auto' }} />
                <h3 style={{ color: 'white', margin: 0 }}>Your Exam Status</h3>
              </div>
              {exams.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>No exams taken yet. Apply for a job from the Job Listings tab!</p>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {exams.map(exam => (
                    <div key={exam.id} style={{
                      background: 'rgba(0,0,0,0.3)',
                      padding: '15px',
                      borderRadius: '10px',
                      borderLeft: `4px solid ${getStatusColor(exam.status)}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ color: 'white', fontWeight: 'bold', marginBottom: '5px' }}>
                            Exam Type: {exam.exam_type.toUpperCase()}
                          </p>
                          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                            Taken on: {new Date(exam.created_at).toLocaleDateString()}
                          </p>
                          {exam.score && exam.status !== 'pending' && (
                            <p style={{ color: '#667eea', fontSize: '0.9rem' }}>
                              Score: {exam.score}/5
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            padding: '5px 15px',
                            borderRadius: '20px',
                            background: getStatusColor(exam.status),
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: 'bold'
                          }}>
                            {exam.status === 'pending' ? 'PENDING' : exam.status.toUpperCase()}
                          </span>
                          <p style={{
                            color: exam.status === 'passed' ? '#2ecc71' : exam.status === 'failed' ? '#e74c3c' : '#f39c12',
                            marginTop: '8px',
                            fontSize: '0.85rem'
                          }}>
                            {getExamStatusText(exam.status)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks Section with icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <img src="/task.png" alt="Task" style={{ height: '30px', width: 'auto' }} />
              <h3 style={{ color: 'white', margin: 0 }}>Your Assigned Tasks</h3>
            </div>
            {loading ? (
              <p style={{ color: 'white' }}>Loading...</p>
            ) : tasks.length === 0 ? (
              <p style={{ color: 'white' }}>No tasks assigned yet. Once you pass the exam, admin will assign tasks.</p>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {tasks.map(task => (
                  <div key={task.id} style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '20px',
                    borderRadius: '15px'
                  }}>
                    <p style={{ color: 'white', marginBottom: '10px' }}>{task.task_text}</p>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '5px 10px',
                        borderRadius: '20px',
                        background: getStatusColor(task.status),
                        color: 'white',
                        fontSize: '0.85rem'
                      }}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                      {task.status === 'in_progress' && (
                        <button
                          className="btn-primary"
                          onClick={() => navigate(`/working/${task.id}`)}
                          style={{ padding: '8px 20px' }}
                        >
                          Start Task
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: User Information */}
        {activeTab === 2 && userInfo && (
          <div>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '25px',
              borderRadius: '15px',
              marginBottom: '30px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <img src="/hat.png" alt="Profile" style={{ height: '30px', width: 'auto' }} />
                <h3 style={{ color: 'white', margin: 0 }}>Profile Information</h3>
              </div>
              <p style={{ color: 'white' }}><strong>Email:</strong> {userInfo.email}</p>
              <p style={{ color: 'white' }}><strong>Phone:</strong> {userInfo.phone}</p>
              <p style={{ color: 'white' }}><strong>Gender:</strong> {userInfo.gender}</p>
              <p style={{ color: 'white' }}><strong>Subscription:</strong> {userInfo.subscription_type}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <img src="/mail.png" alt="Messages" style={{ height: '30px', width: 'auto' }} />
              <h3 style={{ color: 'white', margin: 0 }}>Messages from Admin</h3>
            </div>
            {messages.length === 0 ? (
              <p style={{ color: 'white' }}>No messages yet.</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: '15px',
                  borderRadius: '10px',
                  marginBottom: '10px'
                }}>
                  <p style={{ color: 'white' }}>{msg.admin_message}</p>
                  <small style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {new Date(msg.created_at).toLocaleString()}
                  </small>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Withdrawal */}
        {activeTab === 3 && (
          <div>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              padding: '25px',
              borderRadius: '15px',
              marginBottom: '30px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>Request Withdrawal</h3>
              
              <div style={{
                background: currentBalance > 0 ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <p style={{ color: currentBalance > 0 ? '#2ecc71' : '#e74c3c', fontSize: '2rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  {currency.symbol}{currentBalance} {currency.name}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {currentBalance > 0 ? 'Total Available Balance' : 'No balance available'}
                </p>
              </div>

              {hasPendingWithdrawal && (
                <div style={{
                  background: 'rgba(243,156,18,0.2)',
                  padding: '15px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  borderLeft: '4px solid #f39c12'
                }}>
                  <p style={{ color: '#f39c12', margin: 0 }}>
                    ⏳ You have a pending withdrawal request. Please wait for admin approval before requesting another withdrawal.
                  </p>
                </div>
              )}

              {currentBalance > 0 && !hasPendingWithdrawal && (
                <div style={{
                  background: 'rgba(46,204,113,0.1)',
                  padding: '15px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  borderLeft: '4px solid #2ecc71'
                }}>
                  <p style={{ color: '#2ecc71', marginBottom: '5px' }}>
                    ✅ You can withdraw your entire balance of {currency.symbol}{currentBalance} {currency.name}.
                  </p>
                  <p style={{ color: '#f39c12', margin: 0, fontSize: '0.85rem' }}>
                    ⚠️ Note: The full amount will be deducted immediately. If rejected by admin, it will be refunded.
                  </p>
                </div>
              )}

              <form onSubmit={handleWithdraw}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ color: 'white' }}>Withdrawal Method</label>
                  <select 
                    value={withdrawMethod} 
                    onChange={(e) => setWithdrawMethod(e.target.value)} 
                    required 
                    disabled={currentBalance === 0 || hasPendingWithdrawal || withdrawing}
                    style={{ 
                      color: 'white', 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.3)',
                      opacity: (currentBalance === 0 || hasPendingWithdrawal || withdrawing) ? 0.5 : 1,
                      cursor: (currentBalance === 0 || hasPendingWithdrawal || withdrawing) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="" style={{ color: 'black', backgroundColor: 'white' }}>Select Method</option>
                    <option value="paypal" style={{ color: 'black', backgroundColor: 'white' }}>PayPal</option>
                    <option value="bank" style={{ color: 'black', backgroundColor: 'white' }}>Bank Transfer</option>
                    <option value="airtel" style={{ color: 'black', backgroundColor: 'white' }}>Airtel Money</option>
                    <option value="googlepay" style={{ color: 'black', backgroundColor: 'white' }}>Google Pay</option>
                  </select>
                </div>

                {withdrawMethod === 'paypal' && (
                  <div>
                    <img src="/paypal.png" alt="PayPal" style={{ height: '30px', marginBottom: '10px' }} />
                    <input
                      type="email"
                      placeholder="PayPal Email Address"
                      onChange={(e) => setWithdrawDetails({ email: e.target.value })}
                      required
                      disabled={currentBalance === 0 || hasPendingWithdrawal || withdrawing}
                      style={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)' }}
                    />
                  </div>
                )}

                {withdrawMethod === 'bank' && (
                  <div>
                    <img src="/bank.jpg" alt="Bank Transfer" style={{ height: '30px', marginBottom: '10px' }} />
                    <input type="text" placeholder="Bank Name" onChange={(e) => setWithdrawDetails({ ...withdrawDetails, bank: e.target.value })} required disabled={currentBalance === 0 || hasPendingWithdrawal || withdrawing} style={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)', marginBottom: '10px' }} />
                    <input type="text" placeholder="Account Number" onChange={(e) => setWithdrawDetails({ ...withdrawDetails, account: e.target.value })} required disabled={currentBalance === 0 || hasPendingWithdrawal || withdrawing} style={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)', marginBottom: '10px' }} />
                    <input type="text" placeholder="Account Name" onChange={(e) => setWithdrawDetails({ ...withdrawDetails, name: e.target.value })} required disabled={currentBalance === 0 || hasPendingWithdrawal || withdrawing} style={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)' }} />
                  </div>
                )}

                {withdrawMethod === 'airtel' && (
                  <div>
                    <img src="/Airtel.png" alt="Airtel Money" style={{ height: '30px', marginBottom: '10px' }} />
                    <select onChange={(e) => setWithdrawDetails({ ...withdrawDetails, country: e.target.value })} required disabled={currentBalance === 0 || hasPendingWithdrawal || withdrawing} style={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)', marginBottom: '10px' }}>
                      <option value="" style={{ color: 'black', backgroundColor: 'white' }}>Select Country</option>
                      <option value="MG" style={{ color: 'black', backgroundColor: 'white' }}>Madagascar (+261)</option>
                      <option value="UG" style={{ color: 'black', backgroundColor: 'white' }}>Uganda (+256)</option>
                      <option value="KE" style={{ color: 'black', backgroundColor: 'white' }}>Kenya (+254)</option>
                      <option value="TZ" style={{ color: 'black', backgroundColor: 'white' }}>Tanzania (+255)</option>
                      <option value="RW" style={{ color: 'black', backgroundColor: 'white' }}>Rwanda (+250)</option>
                      <option value="ZM" style={{ color: 'black', backgroundColor: 'white' }}>Zambia (+260)</option>
                      <option value="NG" style={{ color: 'black', backgroundColor: 'white' }}>Nigeria (+234)</option>
                      <option value="GH" style={{ color: 'black', backgroundColor: 'white' }}>Ghana (+233)</option>
                    </select>
                    <input type="tel" placeholder="Phone Number" onChange={(e) => setWithdrawDetails({ ...withdrawDetails, phone: e.target.value })} required disabled={currentBalance === 0 || hasPendingWithdrawal || withdrawing} style={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)' }} />
                  </div>
                )}

                {withdrawMethod === 'googlepay' && (
                  <div>
                    <img src="/google.png" alt="Google Pay" style={{ height: '30px', marginBottom: '10px' }} />
                    <select onChange={(e) => setWithdrawDetails({ ...withdrawDetails, country: e.target.value })} required disabled={currentBalance === 0 || hasPendingWithdrawal || withdrawing} style={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)', marginBottom: '10px' }}>
                      <option value="" style={{ color: 'black', backgroundColor: 'white' }}>Select Country</option>
                      <option value="USA" style={{ color: 'black', backgroundColor: 'white' }}>United States</option>
                      <option value="TH" style={{ color: 'black', backgroundColor: 'white' }}>Thailand</option>
                      <option value="IN" style={{ color: 'black', backgroundColor: 'white' }}>India</option>
                    </select>
                    <input type="tel" placeholder="Phone Number" onChange={(e) => setWithdrawDetails({ ...withdrawDetails, phone: e.target.value })} required disabled={currentBalance === 0 || hasPendingWithdrawal || withdrawing} style={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.3)' }} />
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ 
                    marginTop: '20px', 
                    width: '100%',
                    backgroundColor: (currentBalance > 0 && !hasPendingWithdrawal && !withdrawing) ? '#2ecc71' : '#95a5a6',
                    cursor: (currentBalance > 0 && !hasPendingWithdrawal && !withdrawing) ? 'pointer' : 'not-allowed'
                  }}
                  disabled={currentBalance === 0 || hasPendingWithdrawal || withdrawing}
                >
                  {withdrawing ? 'Processing...' : `Withdraw Full Balance (${currency.symbol}${currentBalance})`}
                </button>
              </form>
            </div>

            <h3 style={{ color: 'white', marginBottom: '20px' }}>Withdrawal History</h3>
            {withdrawals.length === 0 ? (
              <p style={{ color: 'white' }}>No withdrawal requests yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {withdrawals.map(w => (
                  <div key={w.id} style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '15px',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <div>
                      <p style={{ color: 'white', fontWeight: 'bold' }}>Amount: {currency.symbol}{w.amount} {currency.name}</p>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Method: {w.method}</p>
                      <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(w.created_at).toLocaleString()}
                      </small>
                    </div>
                    <span style={{
                      padding: '5px 15px',
                      borderRadius: '20px',
                      background: w.status === 'approved' ? '#2ecc71' : w.status === 'rejected' ? '#e74c3c' : '#f39c12',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {w.status === 'approved' ? 'APPROVED' : w.status === 'rejected' ? 'REJECTED' : 'PENDING'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserPage;