import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function WorkingPage({ token }) {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showRepeat, setShowRepeat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mediaStreamRef = useRef(null);

  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    fetchTask();
    initMicrophone();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err) {
      setError('Please allow microphone access to complete tasks');
    }
  };

  const fetchTask = async () => {
    try {
      const response = await api.get('/tasks');
      const currentTask = response.data.find(t => t.id === taskId);
      setTask(currentTask);
    } catch (err) {
      setError('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) {
      setError('Microphone not accessible');
      return;
    }

    const recorder = new MediaRecorder(mediaStreamRef.current);
    setAudioChunks([]);
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setAudioChunks(prev => [...prev, event.data]);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      submitRecording(audioBlob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);

    // Auto-stop after 30 seconds
    setTimeout(() => {
      if (recorder.state === 'recording') {
        stopRecording();
      }
    }, 30000);
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const submitRecording = async (audioBlob) => {
    const formData = new FormData();
    formData.append('recording', audioBlob, `task_${taskId}_attempt_${attempts + 1}.webm`);

    try {
      await api.post(`/submit-task/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSubmitted(true);
      
      if (attempts + 1 === 1) {
        setShowRepeat(true);
        setAttempts(1);
      } else {
        alert('Task submitted successfully! Waiting for admin approval.');
        navigate('/user');
      }
    } catch (err) {
      setError('Failed to submit recording');
      setShowRepeat(true);
    }
  };

  const handleRepeat = () => {
    setSubmitted(false);
    setShowRepeat(false);
    setError('');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        Loading...
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        Task not found
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgba(0,0,0,0.7)',
      padding: '40px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="glass fade-in" style={{
        maxWidth: '800px',
        width: '100%',
        padding: '40px',
        backdropFilter: 'blur(20px)'
      }}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>Working Task</h2>
        
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '25px',
          borderRadius: '15px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#667eea', marginBottom: '15px' }}>Task Description:</h3>
          <p style={{ color: 'white', fontSize: '1.1rem', lineHeight: '1.6' }}>
            {task.task_text}
          </p>
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

        {!submitted ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'white', marginBottom: '20px' }}>
              Please read the task above and record your response.
            </p>
            
            {!isRecording ? (
              <button
                className="btn-primary"
                onClick={startRecording}
                style={{ fontSize: '1.2rem', padding: '15px 40px' }}
              >
                🎤 Press to Speak
              </button>
            ) : (
              <div>
                <button
                  className="btn-secondary"
                  onClick={stopRecording}
                  style={{ fontSize: '1.2rem', padding: '15px 40px', background: '#e74c3c' }}
                >
                  ⏹️ Stop Recording
                </button>
                <p style={{ color: '#ffa500', marginTop: '15px' }}>
                  Recording... Maximum 30 seconds
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            {showRepeat && attempts < 2 ? (
              <div>
                <p style={{ color: '#ffa500', marginBottom: '20px' }}>
                  Your submission has been recorded. You have one more attempt if needed.
                </p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button className="btn-secondary" onClick={handleRepeat}>
                    Repeat
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      alert('Task submitted final! Waiting for admin approval.');
                      navigate('/user');
                    }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: '#2ecc71', marginBottom: '20px' }}>
                  ✅ Task submitted successfully!
                </p>
                <button
                  className="btn-primary"
                  onClick={() => navigate('/user')}
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            Attempts used: {attempts}/2
          </p>
        </div>
      </div>
    </div>
  );
}

export default WorkingPage;