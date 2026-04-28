import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminPage({ token }) {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [subscriptionCodes, setSubscriptionCodes] = useState([]);
  const [codeType, setCodeType] = useState('english');
  const [newTask, setNewTask] = useState({ userId: '', taskText: '' });
  const [adminMessage, setAdminMessage] = useState({ userId: '', message: '' });
  const [sendMoney, setSendMoney] = useState({ userId: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 0) {
        const codesRes = await api.get('/subscription-codes');
        setSubscriptionCodes(codesRes.data);
      } else if (activeTab === 1) {
        const withdrawalsRes = await api.get('/admin/withdrawals');
        setWithdrawals(withdrawalsRes.data);
      } else if (activeTab === 2) {
        const examsRes = await api.get('/admin/exams');
        setExams(examsRes.data);
      } else if (activeTab === 3) {
        const usersRes = await api.get('/admin/users');
        setUsers(usersRes.data);
        const tasksRes = await api.get('/admin/tasks');
        setTasks(tasksRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching data: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    if (codeType !== 'english' && codeType !== 'french') {
      alert('Only English and French subscription codes can be generated');
      return;
    }
    try {
      const response = await api.post('/generate-code', { type: codeType });
      alert(`Code generated: ${response.data.code}\nType: ${response.data.type}`);
      fetchData();
    } catch (error) {
      alert('Error generating code: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleWithdrawalAction = async (id, status) => {
    try {
      await api.put(`/admin/withdrawal/${id}`, { status });
      alert(`Withdrawal ${status}!`);
      fetchData();
    } catch (error) {
      alert('Error updating withdrawal: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleGradeExam = async (id, status, score) => {
    try {
      await api.put(`/admin/grade-exam/${id}`, { status, score });
      alert(`Exam ${status}! Score: ${score}/5`);
      fetchData();
    } catch (error) {
      alert('Error grading exam: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleTaskAction = async (id, status, amount = 0) => {
    try {
      await api.put(`/admin/task-status/${id}`, { status, amount });
      alert(`Task ${status}!`);
      fetchData();
    } catch (error) {
      alert('Error updating task: ' + (error.response?.data?.error || error.message));
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/admin/task/${id}`);
        alert('Task deleted!');
        fetchData();
      } catch (error) {
        alert('Error deleting task: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const sendTask = async () => {
    if (!newTask.userId || !newTask.taskText) {
      alert('Please select a user and enter task text');
      return;
    }
    try {
      await api.post('/admin/tasks', newTask);
      alert('Task sent to user!');
      setNewTask({ userId: '', taskText: '' });
      fetchData();
    } catch (error) {
      alert('Error sending task: ' + (error.response?.data?.error || error.message));
    }
  };

  const sendMessage = async () => {
    if (!adminMessage.userId || !adminMessage.message) {
      alert('Please select a user and enter message');
      return;
    }
    try {
      await api.post('/admin/message', adminMessage);
      alert('Message sent to user!');
      setAdminMessage({ userId: '', message: '' });
      fetchData();
    } catch (error) {
      alert('Error sending message: ' + (error.response?.data?.error || error.message));
    }
  };

  const sendMoneyToUser = async () => {
    if (!sendMoney.userId || !sendMoney.amount || sendMoney.amount <= 0) {
      alert('Please select a user and enter a valid amount');
      return;
    }
    
    const selectedUser = users.find(u => u.id === sendMoney.userId);
    let currencySymbol = '$';
    switch(selectedUser?.subscription_type) {
      case 'english': currencySymbol = '£'; break;
      case 'french': currencySymbol = '€'; break;
      case 'hindi': currencySymbol = '₹'; break;
      default: currencySymbol = '$';
    }
    
    if (window.confirm(`Send ${currencySymbol}${sendMoney.amount} to ${selectedUser?.email}?`)) {
      try {
        await api.post('/admin/send-money', {
          userId: sendMoney.userId,
          amount: parseFloat(sendMoney.amount)
        });
        alert(`Successfully sent ${currencySymbol}${sendMoney.amount} to user!`);
        setSendMoney({ userId: '', amount: '' });
        fetchData();
      } catch (error) {
        alert('Error sending money: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const deleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await api.delete(`/admin/message/${messageId}`);
        alert('Message deleted!');
        fetchData();
      } catch (error) {
        alert('Error deleting message: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const banUser = async (userId) => {
    if (window.confirm('Are you sure you want to ban and delete this user? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/user/${userId}`);
        alert('User banned and deleted!');
        fetchData();
      } catch (error) {
        alert('Error banning user: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const playRecording = (recordingPath, questionNumber) => {
    if (recordingPath && recordingPath !== 'null' && recordingPath !== 'undefined' && recordingPath !== '') {
      const fullUrl = `http://localhost:5000${recordingPath}`;
      const audio = new Audio(fullUrl);
      audio.play().catch(error => {
        console.error('Playback error:', error);
        alert(`Could not play recording for Question ${questionNumber}.`);
      });
      alert(`Playing Question ${questionNumber} response...`);
    } else {
      alert(`No recording available for Question ${questionNumber}`);
    }
  };

  const getCurrencySymbol = (subscriptionType) => {
    switch(subscriptionType) {
      case 'english': return '£';
      case 'french': return '€';
      case 'hindi': return '₹';
      default: return '$';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'rgba(0,0,0,0.7)', padding: '20px', position: 'relative' }}>
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
          <h1 style={{ color: 'white' }}>Admin Dashboard</h1>
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

        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {['Code Generation', 'Withdrawals', 'Exam Management', 'User Management'].map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              style={{
                padding: '12px 25px',
                background: activeTab === index ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
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

        {/* Tab 0: Code Generation */}
        {activeTab === 0 && (
          <div>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Generate Subscription Codes</h2>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '25px',
              borderRadius: '15px',
              marginBottom: '30px'
            }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: 'white' }}>Subscription Type</label>
                  <select
                    value={codeType}
                    onChange={(e) => setCodeType(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px',
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px'
                    }}
                  >
                    <option value="english" style={{ color: 'white', backgroundColor: '#333' }}>English Voice AI Trainer (UK £)</option>
                    <option value="french" style={{ color: 'white', backgroundColor: '#333' }}>French Voice AI Trainer (EU €)</option>
                  </select>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '5px' }}>
                    Note: Hindi and Coder subscriptions are decorative only
                  </p>
                </div>
                <button className="btn-primary" onClick={generateCode}>
                  Generate Code
                </button>
              </div>
            </div>

            <h3 style={{ color: 'white', marginBottom: '15px' }}>Generated Codes</h3>
            {subscriptionCodes.length === 0 ? (
              <p style={{ color: 'white' }}>No codes generated yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {subscriptionCodes.map(code => (
                  <div key={code.id} style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '15px',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <div>
                      <p style={{ color: '#667eea', fontWeight: 'bold', fontSize: '1.1rem' }}>Code: {code.code}</p>
                      <p style={{ color: 'white' }}>Type: {code.type}</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        Created: {new Date(code.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span style={{
                      padding: '5px 15px',
                      borderRadius: '20px',
                      background: code.is_used ? '#e74c3c' : '#2ecc71',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {code.is_used ? 'Used' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Withdrawals */}
        {activeTab === 1 && (
          <div>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Withdrawal Requests</h2>
            {withdrawals.length === 0 ? (
              <p style={{ color: 'white' }}>No withdrawal requests.</p>
            ) : (
              withdrawals.map(w => {
                const currencySymbol = getCurrencySymbol(w.subscription_type);
                return (
                  <div key={w.id} style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '20px',
                    borderRadius: '15px',
                    marginBottom: '15px'
                  }}>
                    <p style={{ color: 'white' }}><strong>User:</strong> {w.email}</p>
                    <p style={{ color: 'white' }}><strong>Amount:</strong> {currencySymbol}{w.amount}</p>
                    <p style={{ color: 'white' }}><strong>Method:</strong> {w.method}</p>
                    <p style={{ color: 'white' }}><strong>Details:</strong> {JSON.stringify(w.details)}</p>
                    <p style={{ color: 'white' }}><strong>Status:</strong> 
                      <span style={{
                        marginLeft: '10px',
                        padding: '3px 10px',
                        borderRadius: '15px',
                        background: w.status === 'approved' ? '#2ecc71' : w.status === 'rejected' ? '#e74c3c' : '#f39c12',
                        color: 'white'
                      }}>
                        {w.status.toUpperCase()}
                      </span>
                    </p>
                    {w.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button className="btn-primary" onClick={() => handleWithdrawalAction(w.id, 'approved')}>
                          ✅ Approve (Deduct Balance)
                        </button>
                        <button className="btn-secondary" onClick={() => handleWithdrawalAction(w.id, 'rejected')}>
                          ❌ Reject (Refund Balance)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Exam Management - CLEAN VERSION WITH ONLY WORKING BUTTONS */}
        {activeTab === 2 && (
          <div>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>Exam Submissions</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
              Here you can validate or fail user exams. Pending exams need your review.
            </p>
            {exams.length === 0 ? (
              <p style={{ color: 'white' }}>No exam submissions yet.</p>
            ) : (
              exams.map(exam => {
                let recordingsObj = exam.recording_files;
                if (typeof recordingsObj === 'string') {
                  try {
                    recordingsObj = JSON.parse(recordingsObj);
                  } catch(e) {
                    recordingsObj = {};
                  }
                }
                
                // Voice questions with correct keys (1, 2, 5)
                const voiceQuestions = [
                  { key: 1, label: 'Question 1 - "Are you ready to work?"' },
                  { key: 2, label: 'Question 2 - "Tell us more about you?"' },
                  { key: 5, label: 'Question 5 - Voice Response' }
                ];
                
                return (
                  <div key={exam.id} style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '20px',
                    borderRadius: '15px',
                    marginBottom: '15px'
                  }}>
                    <p style={{ color: 'white' }}><strong>User:</strong> {exam.email}</p>
                    <p style={{ color: 'white' }}><strong>Exam Type:</strong> {exam.exam_type.toUpperCase()}</p>
                    <p style={{ color: 'white' }}><strong>Status:</strong> 
                      <span style={{
                        marginLeft: '10px',
                        padding: '3px 10px',
                        borderRadius: '15px',
                        background: exam.status === 'passed' ? '#2ecc71' : exam.status === 'failed' ? '#e74c3c' : '#f39c12',
                        color: 'white'
                      }}>
                        {exam.status === 'pending' ? 'PENDING - Waiting for validation' : exam.status.toUpperCase()}
                      </span>
                    </p>
                    <p style={{ color: 'white' }}><strong>Score:</strong> {exam.score || 'Not graded'} / 5</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                      <strong>Submitted:</strong> {new Date(exam.created_at).toLocaleString()}
                    </p>
                    
                    {exam.answers && (
                      <details style={{ marginTop: '10px' }}>
                        <summary style={{ color: '#667eea', cursor: 'pointer' }}>📝 View Written Answers</summary>
                        <div style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: '10px',
                          borderRadius: '8px',
                          marginTop: '10px'
                        }}>
                          <pre style={{ color: 'white', overflowX: 'auto' }}>
                            {JSON.stringify(exam.answers, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                    
                    {/* Voice Recordings Section */}
                    <div style={{ marginTop: '15px' }}>
                      <strong style={{ color: 'white' }}>🎤 Voice Recordings:</strong>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {voiceQuestions.map(vq => {
                          const recordingPath = recordingsObj && recordingsObj[vq.key];
                          const hasRecording = recordingPath && recordingPath !== 'null' && recordingPath !== 'undefined' && recordingPath !== '';
                          return (
                            <button
                              key={vq.key}
                              className="btn-secondary"
                              onClick={() => playRecording(recordingPath, vq.key)}
                              style={{ 
                                padding: '8px 20px',
                                backgroundColor: hasRecording ? 'rgba(102,126,234,0.5)' : 'rgba(231,76,60,0.3)',
                                cursor: hasRecording ? 'pointer' : 'not-allowed'
                              }}
                              disabled={!hasRecording}
                            >
                              🎤 {hasRecording ? `Play ${vq.label}` : `No recording for Q${vq.key}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                      <button 
                        className="btn-primary" 
                        onClick={() => {
                          const score = prompt('Enter score (0-5):', '5');
                          if (score !== null && score >= 0 && score <= 5) {
                            handleGradeExam(exam.id, 'passed', parseInt(score));
                          } else if (score !== null) {
                            alert('Score must be between 0 and 5');
                          }
                        }}
                        style={{ backgroundColor: '#2ecc71' }}
                      >
                        ✅ Validate & Pass Exam
                      </button>
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleGradeExam(exam.id, 'failed', 0)}
                        style={{ background: '#e74c3c' }}
                      >
                        ❌ Fail Exam
                      </button>
                    </div>
                    
                    {exam.status !== 'pending' && (
                      <div style={{ marginTop: '15px' }}>
                        <p style={{ 
                          color: exam.status === 'passed' ? '#2ecc71' : '#e74c3c',
                          fontWeight: 'bold'
                        }}>
                          {exam.status === 'passed' 
                            ? '✅ User has passed and can now work on tasks' 
                            : '❌ User failed and cannot retake this exam'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: User Management */}
        {activeTab === 3 && (
          <div>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>User Management</h2>
            
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '25px',
              borderRadius: '15px',
              marginBottom: '25px'
            }}>
              <h3 style={{ color: 'white', marginBottom: '15px' }}>💰 Send Money to User</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <select
                  value={sendMoney.userId}
                  onChange={(e) => setSendMoney({ ...sendMoney, userId: e.target.value })}
                  style={{ 
                    padding: '12px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px'
                  }}
                >
                  <option value="" style={{ color: 'white', backgroundColor: '#333' }}>Select User</option>
                  {users.map(user => {
                    const currencySymbol = getCurrencySymbol(user.subscription_type);
                    return (
                      <option key={user.id} value={user.id} style={{ color: 'white', backgroundColor: '#333' }}>
                        {user.email} - Balance: {currencySymbol}{user.total_earned || 0}
                      </option>
                    );
                  })}
                </select>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={sendMoney.amount}
                    onChange={(e) => setSendMoney({ ...sendMoney, amount: e.target.value })}
                    style={{ flex: 1, padding: '12px', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}
                    min="0.01"
                    step="0.01"
                  />
                  <button className="btn-primary" onClick={sendMoneyToUser}>
                    Send Money
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '25px',
              borderRadius: '15px',
              marginBottom: '25px'
            }}>
              <h3 style={{ color: 'white', marginBottom: '15px' }}>📋 Send Task to User</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <select
                  value={newTask.userId}
                  onChange={(e) => setNewTask({ ...newTask, userId: e.target.value })}
                  style={{ 
                    padding: '12px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px'
                  }}
                >
                  <option value="" style={{ color: 'white', backgroundColor: '#333' }}>Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id} style={{ color: 'white', backgroundColor: '#333' }}>{user.email}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Enter task description..."
                  value={newTask.taskText}
                  onChange={(e) => setNewTask({ ...newTask, taskText: e.target.value })}
                  rows="3"
                  style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}
                />
                <button className="btn-primary" onClick={sendTask}>
                  Send Task
                </button>
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '25px',
              borderRadius: '15px',
              marginBottom: '25px'
            }}>
              <h3 style={{ color: 'white', marginBottom: '15px' }}>💬 Send Message to User</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <select
                  value={adminMessage.userId}
                  onChange={(e) => setAdminMessage({ ...adminMessage, userId: e.target.value })}
                  style={{ 
                    padding: '12px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px'
                  }}
                >
                  <option value="" style={{ color: 'white', backgroundColor: '#333' }}>Select User</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id} style={{ color: 'white', backgroundColor: '#333' }}>{user.email}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Enter message..."
                  value={adminMessage.message}
                  onChange={(e) => setAdminMessage({ ...adminMessage, message: e.target.value })}
                  rows="2"
                  style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px' }}
                />
                <button className="btn-primary" onClick={sendMessage}>
                  Send Message
                </button>
              </div>
            </div>

                        {/* Tasks List */}
            <h3 style={{ color: 'white', marginBottom: '15px' }}>📝 All User Tasks</h3>
            {tasks.length === 0 ? (
              <p style={{ color: 'white' }}>No tasks assigned yet.</p>
            ) : (
              tasks.map(task => {
                const user = users.find(u => u.id === task.user_id);
                const currencySymbol = getCurrencySymbol(user?.subscription_type);
                return (
                  <div key={task.id} style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '20px',
                    borderRadius: '15px',
                    marginBottom: '15px'
                  }}>
                    <p style={{ color: 'white' }}><strong>User:</strong> {task.email}</p>
                    <p style={{ color: 'white' }}><strong>Task:</strong> {task.task_text}</p>
                    <p style={{ color: 'white' }}><strong>Status:</strong> 
                      <span style={{
                        marginLeft: '10px',
                        padding: '3px 10px',
                        borderRadius: '15px',
                        background: task.status === 'paid' ? '#2ecc71' : task.status === 'submitted' ? '#3498db' : task.status === 'rejected' ? '#e74c3c' : '#f39c12',
                        color: 'white'
                      }}>
                        {task.status.toUpperCase()}
                      </span>
                    </p>
                    {task.voice_recording && (
                      <button
                        className="btn-primary"
                        onClick={() => {
                          const fullUrl = `http://localhost:5000${task.voice_recording}`;
                          console.log('Attempting to play:', fullUrl);
                          const audio = new Audio(fullUrl);
                          audio.play()
                            .then(() => {
                              console.log('Playing task recording successfully');
                            })
                            .catch(error => {
                              console.error('Playback error:', error);
                              alert(`Could not play recording. Error: ${error.message}\nURL: ${fullUrl}`);
                            });
                        }}
                        style={{ marginTop: '10px', backgroundColor: '#3498db' }}
                      >
                        🎤 Listen to User's Recording
                      </button>
                    )}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                      {task.status === 'submitted' && (
                        <>
                          <button className="btn-primary" onClick={() => {
                            const amount = prompt('Enter payment amount:', '10');
                            if (amount && !isNaN(amount) && amount > 0) {
                              handleTaskAction(task.id, 'paid', parseFloat(amount));
                            }
                          }}>
                            ✅ Approve & Pay ({currencySymbol})
                          </button>
                          <button className="btn-secondary" onClick={() => handleTaskAction(task.id, 'rejected')}>
                            ❌ Reject
                          </button>
                        </>
                      )}
                      <button className="btn-secondary" onClick={() => deleteTask(task.id)} style={{ background: '#e74c3c' }}>
                        🗑️ Delete Task
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            <h3 style={{ color: 'white', marginBottom: '15px', marginTop: '25px' }}>👥 Registered Users</h3>
            {users.length === 0 ? (
              <p style={{ color: 'white' }}>No users registered yet.</p>
            ) : (
              users.map(user => {
                const currencySymbol = getCurrencySymbol(user.subscription_type);
                return (
                  <div key={user.id} style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '15px',
                    borderRadius: '10px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div>
                      <p style={{ color: 'white', fontWeight: 'bold' }}>{user.email}</p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                        Type: {user.subscription_type || 'N/A'} | Phone: {user.phone || 'N/A'} | Gender: {user.gender || 'N/A'}
                      </p>
                      <p style={{ color: '#2ecc71', fontSize: '0.9rem' }}>
                        Earned: {currencySymbol}{user.total_earned || 0}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      className="btn-secondary" 
                      onClick={() => banUser(user.id)} 
                      style={{ background: '#e74c3c' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#c0392b'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#e74c3c'}
                    >
                      🚫 Ban User
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;