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

  const API_URL = 'https://ailigner-backend.onrender.com';

  const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: { Authorization: `Bearer ${token}` }
  });

  // Audio files mapping for questions
  const audioFiles = {
    english: {
      1: '/english1.mp3',
      2: '/english2.mp3',
      5: '/english5.mp3'
    },
    french: {
      1: '/french1.mp3',
      2: '/french2.mp3',
      5: '/french5.mp3',
      8: '/french8.m4a'
    }
  };

  // English Questions (6 questions)
  const englishQuestions = [
    { id: 0, questionNumber: 1, text: "Are you ready to work?", type: "voice", audioKey: 1 },
    { id: 1, questionNumber: 2, text: "Tell us more about you?", type: "voice", audioKey: 2 },
    { id: 2, questionNumber: 3, text: "How does a bank handle loan non repayment?", type: "text" },
    { id: 3, questionNumber: 4, text: "Please make this calculation 4236+16988+1001", type: "text" },
    { id: 4, questionNumber: 5, text: "How did you learned english?", type: "voice", audioKey: 5 },
    { id: 5, questionNumber: 6, text: "How do The AI industry work?", type: "text" }
  ];

  // French Questions (8 questions - 2 new ones added)
  const frenchQuestions = [
    { id: 0, questionNumber: 1, text: "Etes vous pret a travailler?", type: "voice", audioKey: 1 },
    { id: 1, questionNumber: 2, text: "Dites nous en plus sur vous.", type: "voice", audioKey: 2 },
    { id: 2, questionNumber: 3, text: "Comment une banque fait du profit?", type: "text" },
    { id: 3, questionNumber: 4, text: "Please make this calculation 4236+16988+1001", type: "text" },
    { id: 4, questionNumber: 5, text: "Comment avez vous appris le Français?", type: "voice", audioKey: 5 },
    { id: 5, questionNumber: 6, text: "dans quelle mesure la diversification du conglomérat est elle uni dans un contexte bilateral?", type: "text" },
    { id: 6, questionNumber: 7, text: "utiliser vous souvent l'IA dans votre quotidien et pourquoi?", type: "text" },
    { id: 7, questionNumber: 8, text: "Question 8 - Voice Response", type: "voice", audioKey: 8 }
  ];

  const questions = type === 'french' ? frenchQuestions : englishQuestions;

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
      const qNum = questions[currentIndex].questionNumber;
      console.log(`SAVING: Question ${qNum} recording`);
      setRecordings(prev => ({ ...prev, [qNum]: audioBlob }));
      setIsRecording(false);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    
    // Auto-stop after 60 seconds
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
    console.log('Answers:', answers);
    
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

  // Calculate progress percentage
  const progress = ((currentIndex + 1) / questions.length) * 100;

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
        backdropFilter: 'blur(20px)',
        borderRadius: '20px'
      }}>
        {/* Progress Bar */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            height: '10px',
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              Question {currentIndex + 1} of {questions.length}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              {Math.round(progress)}% Complete
            </p>
          </div>
        </div>

        {/* Question Type Header */}
        <div style={{
          display: 'inline-block',
          padding: '5px 15px',
          borderRadius: '20px',
          background: currentQ.type === 'voice' ? 'rgba(156, 39, 176, 0.3)' : 'rgba(52, 152, 219, 0.3)',
          marginBottom: '20px'
        }}>
          <span style={{ color: 'white', fontSize: '0.85rem' }}>
            {currentQ.type === 'voice' ? '🎤 VOICE RESPONSE' : '✏️ WRITTEN RESPONSE'}
          </span>
        </div>

        {/* Question Text */}
        <h2 style={{ color: 'white', marginBottom: '25px', fontSize: '1.6rem', lineHeight: '1.4' }}>
          {currentQ.type === 'voice' ? (
            <span>🎤 {currentQ.text}</span>
          ) : (
            <span>📝 {currentQ.text}</span>
          )}
        </h2>

        {/* Play Audio Button for Voice Questions */}
        {currentQ.type === 'voice' && currentQ.audioKey && (
          <button
            onClick={playQuestionAudio}
            disabled={playingAudio}
            style={{
              background: 'rgba(102,126,234,0.3)',
              border: '1px solid rgba(102,126,234,0.5)',
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
              fontSize: '1rem',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (!playingAudio) e.currentTarget.style.background = 'rgba(102,126,234,0.5)';
            }}
            onMouseLeave={(e) => {
              if (!playingAudio) e.currentTarget.style.background = 'rgba(102,126,234,0.3)';
            }}
          >
            <span style={{ fontSize: '20px' }}>🔊</span>
            {playingAudio ? 'Playing question audio...' : 'Click to listen to the question'}
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(231,76,60,0.2)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#ff6b6b',
            textAlign: 'center',
            borderLeft: '3px solid #e74c3c'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Voice Recording Section */}
        {currentQ.type === 'voice' && (
          <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '15px' }}>
            {!hasRecording ? (
              <div>
                {!isRecording ? (
                  <button
                    className="btn-primary"
                    onClick={startRecording}
                    style={{
                      fontSize: '1.3rem',
                      padding: '18px 45px',
                      borderRadius: '50px',
                      background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                      boxShadow: '0 4px 15px rgba(231,76,60,0.4)'
                    }}
                  >
                    🎤 Start Recording Your Answer
                  </button>
                ) : (
                  <div>
                    <button
                      className="btn-secondary"
                      onClick={stopRecording}
                      style={{
                        fontSize: '1.3rem',
                        padding: '18px 45px',
                        borderRadius: '50px',
                        background: '#e74c3c',
                        animation: 'pulse 1s infinite'
                      }}
                    >
                      ⏹️ Stop Recording
                    </button>
                    <p style={{ color: '#ffa500', marginTop: '15px', fontSize: '0.9rem' }}>
                      🔴 Recording in progress... Click stop when you finish speaking
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '10px', fontSize: '0.8rem' }}>
                      Maximum recording time: 60 seconds
                    </p>
                  </div>
                )}
                <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '20px', fontSize: '0.85rem' }}>
                  Click the speaker button above to hear the question again before recording
                </p>
              </div>
            ) : (
              <div>
                <div style={{
                  background: 'rgba(46,204,113,0.2)',
                  padding: '25px',
                  borderRadius: '15px',
                  marginBottom: '15px',
                  border: '1px solid rgba(46,204,113,0.3)'
                }}>
                  <p style={{ color: '#2ecc71', marginBottom: '10px', fontSize: '1.2rem' }}>
                    ✅ Answer Recorded Successfully!
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
                    Your response for Question {currentQ.questionNumber} has been saved.
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: '10px' }}>
                    Click Next to continue to the next question.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Answer Section */}
        {currentQ.type === 'text' && (
          <div>
            <textarea
              value={answers[currentQ.questionNumber] || ''}
              onChange={(e) => handleTextAnswer(e.target.value)}
              placeholder="Type your answer here... Please provide a detailed response."
              rows="8"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '15px',
                marginBottom: '10px',
                backgroundColor: 'rgba(0,0,0,0.4)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textAlign: 'right' }}>
              Minimum 20 characters recommended
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '15px', marginTop: '30px', justifyContent: 'space-between' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
                setError('');
              }
            }}
            disabled={currentIndex === 0}
            style={{
              padding: '12px 30px',
              borderRadius: '30px',
              background: currentIndex === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: currentIndex === 0 ? 0.5 : 1,
              transition: 'all 0.3s'
            }}
          >
            ← Previous Question
          </button>
          
          {!isLast ? (
            <button 
              className="btn-primary" 
              onClick={nextQuestion}
              disabled={currentQ.type === 'voice' && !hasRecording}
              style={{
                padding: '12px 35px',
                borderRadius: '30px',
                background: (currentQ.type === 'voice' && !hasRecording) 
                  ? 'rgba(102,126,234,0.3)' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                color: 'white',
                cursor: (currentQ.type === 'voice' && !hasRecording) ? 'not-allowed' : 'pointer',
                opacity: (currentQ.type === 'voice' && !hasRecording) ? 0.5 : 1,
                transition: 'all 0.3s'
              }}
            >
              Next Question →
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={submitExam}
              disabled={submitting || (currentQ.type === 'voice' && !hasRecording)}
              style={{
                padding: '12px 35px',
                borderRadius: '30px',
                background: (submitting || (currentQ.type === 'voice' && !hasRecording))
                  ? 'rgba(46,204,113,0.3)'
                  : 'linear-gradient(135deg, #2ecc71, #27ae60)',
                border: 'none',
                color: 'white',
                cursor: (submitting || (currentQ.type === 'voice' && !hasRecording)) ? 'not-allowed' : 'pointer',
                opacity: (submitting || (currentQ.type === 'voice' && !hasRecording)) ? 0.5 : 1,
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              {submitting ? '⏳ Submitting Exam...' : '✅ Submit Exam'}
            </button>
          )}
        </div>

        {/* Warning Note */}
        <div style={{ marginTop: '25px', textAlign: 'center' }}>
          <p style={{ color: '#f39c12', fontSize: '0.8rem' }}>
            ⏳ Once submitted, your exam will be pending admin review.
            You cannot edit your answers after submission.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ExamPage;