import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ExamPage({ token }) {
  const { type } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recordings, setRecordings] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [playingAudio, setPlayingAudio] = useState(false);
  const mediaStreamRef = useRef(null);
  const audioRef = useRef(null);

  const api = axios.create({
    baseURL: '/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  // Audio files mapping
  const audioFiles = {
    english: {
      1: '/english1.mp3',
      2: '/english2.mp3',
      5: '/english5.mp3'
    },
    french: {
      1: '/french1.mp3',
      2: '/french2.mp3',
      5: '/french5.mp3'
    }
  };

  // Define questions with their actual question numbers
  const questions = type === 'french' ? [
    { displayIndex: 1, questionNumber: 1, text: "Etes vous pret a travailler?", type: "voice", audioKey: 1 },
    { displayIndex: 2, questionNumber: 2, text: "Dites nous en plus sur vous.", type: "voice", audioKey: 2 },
    { displayIndex: 3, questionNumber: 3, text: "Comment une banque fait du profit?", type: "text" },
    { displayIndex: 4, questionNumber: 4, text: "Please make this calculation 4236+16988+1001", type: "text" },
    { displayIndex: 5, questionNumber: 5, text: "Comment avez vous appris le Français?", type: "voice", audioKey: 5 },
    { displayIndex: 6, questionNumber: 6, text: "dans quelle mesure la diversification du conglomérat est elle uni dans un contexte bilateral?", type: "text" }
  ] : [
    { displayIndex: 1, questionNumber: 1, text: "Are you ready to work?", type: "voice", audioKey: 1 },
    { displayIndex: 2, questionNumber: 2, text: "Tell us more about you?", type: "voice", audioKey: 2 },
    { displayIndex: 3, questionNumber: 3, text: "How does a bank handle loan non repayment?", type: "text" },
    { displayIndex: 4, questionNumber: 4, text: "Please make this calculation 4236+16988+1001", type: "text" },
    { displayIndex: 5, questionNumber: 5, text: "How did you learned english?", type: "voice", audioKey: 5 },
    { displayIndex: 6, questionNumber: 6, text: "How do The AI industry work?", type: "text" }
  ];

  useEffect(() => {
    const initMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      } catch (err) {
        setError('Please allow microphone access to take the exam');
      }
    };
    initMicrophone();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const playQuestionAudio = () => {
    const currentQ = questions[currentIndex];
    if (currentQ.audioKey && audioFiles[type] && audioFiles[type][currentQ.audioKey]) {
      const audioUrl = audioFiles[type][currentQ.audioKey];
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setPlayingAudio(true);
      audio.play();
      audio.onended = () => {
        setPlayingAudio(false);
      };
      audio.onerror = () => {
        setPlayingAudio(false);
        setError('Could not play audio file. Please continue with the question.');
      };
    } else {
      setError('Audio file not available for this question.');
    }
  };

  const startRecording = async () => {
    if (!mediaStreamRef.current) {
      setError('Microphone not accessible');
      return;
    }

    setAudioChunks([]);
    const recorder = new MediaRecorder(mediaStreamRef.current);
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setAudioChunks(prev => [...prev, event.data]);
      }
    };

    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      // Store recording with the ACTUAL question number (1, 2, or 5)
      const qNum = questions[currentIndex].questionNumber;
      console.log(`SAVING: Question ${qNum} recording`);
      setRecordings(prev => ({ ...prev, [qNum]: audioBlob }));
      setIsRecording(false);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    
    setTimeout(() => {
      if (recorder.state === 'recording') {
        stopRecording();
      }
    }, 60000);
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  };

  const handleTextAnswer = (value) => {
    const qNum = questions[currentIndex].questionNumber;
    setAnswers(prev => ({ ...prev, [qNum]: value }));
  };

  const nextQuestion = () => {
    const qNum = questions[currentIndex].questionNumber;
    if (questions[currentIndex].type === 'voice' && !recordings[qNum]) {
      setError('Please record your answer before proceeding');
      return;
    }
    if (questions[currentIndex].type === 'text' && !answers[qNum]) {
      setError('Please provide an answer before proceeding');
      return;
    }
    setError('');
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const submitExam = async () => {
    const lastQNum = questions[currentIndex].questionNumber;
    if (questions[currentIndex].type === 'voice' && !recordings[lastQNum]) {
      setError('Please record your answer before submitting');
      return;
    }
    if (questions[currentIndex].type === 'text' && !answers[lastQNum]) {
      setError('Please provide an answer before submitting');
      return;
    }

    setSubmitting(true);
    
    console.log('FINAL RECORDINGS OBJECT:', recordings);
    console.log('Recordings keys:', Object.keys(recordings));
    
    const recordingUrls = {};
    for (const [qNum, blob] of Object.entries(recordings)) {
      const formData = new FormData();
      formData.append('recording', blob, `question_${qNum}.webm`);
      try {
        const response = await api.post('/upload-recording', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        recordingUrls[qNum] = response.data.url;
        console.log(`Uploaded Question ${qNum} to:`, response.data.url);
      } catch (err) {
        console.error('Upload failed for question', qNum, err);
      }
    }

    console.log('Final recording URLs to save:', recordingUrls);

    try {
      await api.post('/submit-exam', {
        examType: type,
        answers: answers,
        recordings: recordingUrls
      });
      
      alert('Exam submitted successfully! Your exam is now pending admin review.');
      navigate('/user');
    } catch (err) {
      setError('Failed to submit exam: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const hasRecording = currentQ.type === 'voice' && recordings[currentQ.questionNumber];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url('/ROBOT.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
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
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            background: 'rgba(102,126,234,0.3)',
            height: '8px',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
              transition: 'width 0.3s'
            }} />
          </div>
          <p style={{ color: 'white', marginTop: '10px', textAlign: 'right' }}>
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>

        <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '1.5rem' }}>
          {currentQ.type === 'voice' ? '🎤 Voice Response Required' : '✏️ Written Response Required'}
        </h2>

        {currentQ.type === 'voice' && currentQ.audioKey && (
          <button
            onClick={playQuestionAudio}
            disabled={playingAudio}
            style={{
              background: 'rgba(102,126,234,0.3)',
              border: 'none',
              borderRadius: '50px',
              padding: '12px 25px',
              marginBottom: '25px',
              color: 'white',
              cursor: playingAudio ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              justifyContent: 'center',
              fontSize: '1rem'
            }}
          >
            <span style={{ fontSize: '20px' }}>🔊</span>
            {playingAudio ? 'Playing question...' : 'Listen to the question'}
          </button>
        )}

        {error && (
          <div style={{
            background: 'rgba(255,0,0,0.2)',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#ff6b6b'
          }}>
            {error}
          </div>
        )}

        {currentQ.type === 'voice' ? (
          <div style={{ textAlign: 'center' }}>
            {!hasRecording ? (
              <div>
                {!isRecording ? (
                  <button
                    className="btn-primary"
                    onClick={startRecording}
                    style={{ fontSize: '1.2rem', padding: '15px 40px' }}
                  >
                    🎤 Start Recording Answer
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
                      🔴 Recording in progress... Click stop when finished
                    </p>
                  </div>
                )}
                <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '15px', fontSize: '0.85rem' }}>
                  Click the speaker button above to hear the question again
                </p>
              </div>
            ) : (
              <div>
                <div style={{
                  background: 'rgba(46,204,113,0.2)',
                  padding: '20px',
                  borderRadius: '10px',
                  marginBottom: '15px'
                }}>
                  <p style={{ color: '#2ecc71', marginBottom: '10px', fontSize: '1.1rem' }}>
                    ✅ Answer recorded successfully for Question {currentQ.questionNumber}!
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                    Your response has been saved. Click Next to continue.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p style={{ color: 'white', marginBottom: '15px' }}>
              {currentQ.text}
            </p>
            <textarea
              value={answers[currentQ.questionNumber] || ''}
              onChange={(e) => handleTextAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows="6"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '14px',
                marginBottom: '20px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px'
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', marginTop: '30px', justifyContent: 'center' }}>
          {currentIndex > 0 && (
            <button
              className="btn-secondary"
              onClick={() => {
                setCurrentIndex(currentIndex - 1);
                setError('');
              }}
            >
              Previous Question
            </button>
          )}
          
          {!isLast ? (
            <button 
              className="btn-primary" 
              onClick={nextQuestion}
              disabled={currentQ.type === 'voice' && !hasRecording}
              style={{
                opacity: (currentQ.type === 'voice' && !hasRecording) ? 0.5 : 1
              }}
            >
              Next Question
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={submitExam}
              disabled={submitting || (currentQ.type === 'voice' && !hasRecording)}
              style={{
                opacity: (submitting || (currentQ.type === 'voice' && !hasRecording)) ? 0.5 : 1
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          )}
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ color: '#f39c12', fontSize: '0.85rem' }}>
            ⏳ Note: After submission, your exam will be pending admin review.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ExamPage;