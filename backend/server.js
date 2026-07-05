const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const { neon } = require('@neondatabase/serverless');

const app = express();
const PORT = process.env.PORT || 5000;

// ============= CLOUDINARY CONFIGURATION =============
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('☁️ Cloudinary configured successfully!');

const sql = neon(process.env.NEON_DATABASE_URL);

// ============= MIDDLEWARE =============
app.use(cors({
  origin: ['http://localhost:3000', 'https://ailigner.netlify.app', 'https://*.netlify.app', 'https://ailigner-backend.onrender.com'],
  credentials: true
}));
app.use(express.json());

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ============= HELPER: Upload to Cloudinary =============
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      ...options,
      access_mode: 'public',
      type: 'upload'
    };
    
    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// ============= HELPER: Determine resource type =============
const getResourceType = (filename, mimetype) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  // Check if it's an image
  if (imageExtensions.includes(ext) || mimetype.startsWith('image/')) {
    return 'image';
  }
  // Everything else (PDF, DOC, etc.) is raw
  return 'raw';
};

// ============= AUTHENTICATION MIDDLEWARE =============

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ============= DATABASE SETUP =============

const initializeDatabase = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        gender VARCHAR(20),
        passport_photo TEXT,
        subscription_code VARCHAR(100),
        subscription_type VARCHAR(50),
        role VARCHAR(20) DEFAULT 'user',
        is_banned BOOLEAN DEFAULT false,
        total_earned DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        task_text TEXT,
        voice_recording TEXT,
        file_url TEXT,
        user_file_url TEXT,
        submission_type VARCHAR(20),
        status VARCHAR(20) DEFAULT 'in_progress',
        admin_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        exam_type VARCHAR(50),
        answers JSONB,
        recording_files JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        score INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2),
        method VARCHAR(50),
        details JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        admin_message TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS subscription_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(50),
        is_used BOOLEAN DEFAULT false,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('✅ Tables created successfully');

    const adminExists = await sql`
      SELECT * FROM users WHERE email = 'admin@ailigner.com'
    `;
    
    if (adminExists.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      await sql`
        INSERT INTO users (email, password, role, subscription_type)
        VALUES ('admin@ailigner.com', ${hashedPassword}, 'admin', 'admin')
      `;
      console.log('✅ Admin user created');
    }

    const codesExist = await sql`
      SELECT * FROM subscription_codes LIMIT 1
    `;
    
    if (codesExist.length === 0) {
      const testCodes = [
        { code: 'ENG2024', type: 'english' },
        { code: 'FR2024', type: 'french' }
      ];
      
      for (const testCode of testCodes) {
        await sql`
          INSERT INTO subscription_codes (code, type, is_used)
          VALUES (${testCode.code}, ${testCode.type}, false)
        `;
      }
      console.log('✅ Test subscription codes created');
    }

    console.log('🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

initializeDatabase();

// ============= AUTH ROUTES =============

app.get('/', (req, res) => {
  res.json({ message: 'AIligner Backend API is running!' });
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const users = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    if (user.is_banned) {
      return res.status(401).json({ error: 'Account banned' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        subscription_type: user.subscription_type
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/signup', upload.single('passport_photo'), async (req, res) => {
  try {
    const { email, phone, gender, password, subscription_code } = req.body;
    
    let passport_photo_url = null;
    
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'ailigner_passports',
          resource_type: 'image'
        });
        passport_photo_url = result.secure_url;
      } catch (err) {
        console.error('Cloudinary upload error:', err);
      }
    }
    
    const existingUser = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const codes = await sql`
      SELECT * FROM subscription_codes WHERE code = ${subscription_code} AND is_used = false
    `;
    
    if (codes.length === 0) {
      return res.status(400).json({ error: 'Invalid or used subscription code' });
    }
    
    const code = codes[0];
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const users = await sql`
      INSERT INTO users (email, phone, gender, password, passport_photo, subscription_code, subscription_type)
      VALUES (${email}, ${phone}, ${gender}, ${hashedPassword}, ${passport_photo_url}, ${subscription_code}, ${code.type})
      RETURNING id, email, role, subscription_type
    `;
    
    await sql`
      UPDATE subscription_codes SET is_used = true WHERE code = ${subscription_code}
    `;
    
    const token = jwt.sign(
      { id: users[0].id, email: users[0].email, role: users[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: users[0] });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-code', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { type } = req.body;
    
    if (type !== 'english' && type !== 'french') {
      return res.status(400).json({ error: 'Only English and French subscription codes can be generated' });
    }
    
    const code = uuidv4().slice(0, 8).toUpperCase();
    
    await sql`
      INSERT INTO subscription_codes (code, type, created_by)
      VALUES (${code}, ${type}, ${req.user.id})
    `;
    
    res.json({ code, type });
  } catch (error) {
    console.error('Generate code error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subscription-codes', authenticateToken, isAdmin, async (req, res) => {
  try {
    const codes = await sql`
      SELECT * FROM subscription_codes ORDER BY created_at DESC
    `;
    res.json(codes);
  } catch (error) {
    console.error('Get codes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= JOB LISTINGS =============

const jobListings = {
  english: {
    title: "English Voice AI Trainer",
    salary: "£1-6/Day",
    examType: "english"
  },
  french: {
    title: "French Voice AI Trainer", 
    salary: "€1-5/Day",
    examType: "french"
  },
  hindi: {
    title: "Hindi Voice Trainer",
    salary: "₹100-500/Day",
    examType: "hindi"
  },
  coder: {
    title: "AI Coders",
    salary: "$1-20/Day",
    examType: "coding"
  }
};

app.get('/api/jobs', authenticateToken, async (req, res) => {
  try {
    res.json(jobListings);
  } catch (error) {
    console.error('Jobs error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/apply-job', authenticateToken, async (req, res) => {
  try {
    const { jobType } = req.body;
    const user = await sql`
      SELECT subscription_type FROM users WHERE id = ${req.user.id}
    `;
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    let jobKey = '';
    if (jobType === 'english') jobKey = 'english';
    else if (jobType === 'french') jobKey = 'french';
    else if (jobType === 'hindi') jobKey = 'hindi';
    else if (jobType === 'coder') jobKey = 'coder';
    
    if (user[0].subscription_type !== jobKey) {
      return res.status(403).json({ error: 'You are not subscribed to this field' });
    }
    
    const existingExam = await sql`
      SELECT * FROM exams WHERE user_id = ${req.user.id} AND exam_type = ${jobKey}
    `;
    
    if (existingExam.length > 0) {
      return res.status(400).json({ error: 'You have already taken this exam' });
    }
    
    res.json({ message: 'Exam can be started', examType: jobKey });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= EXAMS =============

app.post('/api/upload-recording', authenticateToken, upload.single('recording'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'ailigner_exam_recordings',
      resource_type: 'video' // Audio files work with video resource type
    });
    
    console.log('✅ Recording uploaded to Cloudinary:', result.secure_url);
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Upload recording error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/submit-exam', authenticateToken, async (req, res) => {
  try {
    const { examType, answers, recordings } = req.body;
    
    const status = 'pending';
    const score = null;
    
    await sql`
      INSERT INTO exams (user_id, exam_type, answers, recording_files, status, score)
      VALUES (${req.user.id}, ${examType}, ${JSON.stringify(answers)}, ${JSON.stringify(recordings)}, ${status}, ${score})
    `;
    
    res.json({ 
      status: 'pending',
      message: 'Exam submitted successfully! Waiting for admin validation.'
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/my-exams', authenticateToken, async (req, res) => {
  try {
    const exams = await sql`
      SELECT * FROM exams WHERE user_id = ${req.user.id} ORDER BY created_at DESC
    `;
    res.json(exams);
  } catch (error) {
    console.error('Get my exams error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/exams', authenticateToken, isAdmin, async (req, res) => {
  try {
    const exams = await sql`
      SELECT e.*, u.email, u.subscription_type 
      FROM exams e 
      JOIN users u ON e.user_id = u.id 
      ORDER BY e.created_at DESC
    `;
    res.json(exams);
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/grade-exam/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, score } = req.body;
    await sql`
      UPDATE exams SET status = ${status}, score = ${score}
      WHERE id = ${req.params.id}
    `;
    res.json({ message: 'Exam graded successfully' });
  } catch (error) {
    console.error('Grade exam error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= TASKS =============

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await sql`
      SELECT * FROM tasks WHERE user_id = ${req.user.id} ORDER BY created_at DESC
    `;
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/tasks', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId, taskText, submissionType, adminMessage } = req.body;
    const task = await sql`
      INSERT INTO tasks (user_id, task_text, submission_type, admin_message, status)
      VALUES (${userId}, ${taskText}, ${submissionType}, ${adminMessage || null}, 'in_progress')
      RETURNING *
    `;
    res.json(task[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/submit-task-voice/:id', authenticateToken, upload.single('recording'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'ailigner_task_recordings',
      resource_type: 'video'
    });
    
    await sql`
      UPDATE tasks 
      SET voice_recording = ${result.secure_url}, status = 'submitted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.params.id} AND user_id = ${req.user.id}
    `;
    res.json({ message: 'Voice submitted successfully', recordingPath: result.secure_url });
  } catch (error) {
    console.error('Submit voice error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/submit-task-file/:id', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Determine resource type based on file
    const resourceType = getResourceType(req.file.originalname, req.file.mimetype);
    
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'ailigner_task_files',
      resource_type: resourceType,
      use_filename: true,
      unique_filename: false
    });
    
    await sql`
      UPDATE tasks 
      SET user_file_url = ${result.secure_url}, status = 'submitted', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.params.id} AND user_id = ${req.user.id}
    `;
    res.json({ message: 'File submitted successfully', fileUrl: result.secure_url });
  } catch (error) {
    console.error('Submit file error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= ADMIN TASK FILE UPLOAD (FIXED PDF) =============
app.post('/api/admin/task-file/:id', authenticateToken, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Determine resource type based on file
    const resourceType = getResourceType(req.file.originalname, req.file.mimetype);
    
    console.log('📁 Uploading file:', req.file.originalname);
    console.log('📁 Resource type:', resourceType);
    console.log('📁 MIME type:', req.file.mimetype);
    
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'ailigner_admin_files',
      resource_type: resourceType,
      use_filename: true,
      unique_filename: false,
      public_id: req.file.originalname.split('.')[0] // Use original filename without extension
    });
    
    await sql`
      UPDATE tasks SET file_url = ${result.secure_url}
      WHERE id = ${req.params.id}
    `;
    res.json({ message: 'File uploaded successfully', fileUrl: result.secure_url });
  } catch (error) {
    console.error('Admin upload file error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/tasks', authenticateToken, isAdmin, async (req, res) => {
  try {
    const tasks = await sql`
      SELECT t.*, u.email, u.subscription_type 
      FROM tasks t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
    `;
    res.json(tasks);
  } catch (error) {
    console.error('Get admin tasks error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/task-status/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, amount } = req.body;
    
    await sql`
      UPDATE tasks SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${req.params.id}
    `;
    
    if (status === 'paid' && amount) {
      const task = await sql`SELECT user_id FROM tasks WHERE id = ${req.params.id}`;
      if (task.length > 0) {
        await sql`
          UPDATE users SET total_earned = total_earned + ${amount}
          WHERE id = ${task[0].user_id}
        `;
      }
    }
    
    res.json({ message: 'Task status updated' });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/task/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM tasks WHERE id = ${req.params.id}`;
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= WITHDRAWALS =============

app.post('/api/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount, method, details } = req.body;
    
    const user = await sql`
      SELECT total_earned FROM users WHERE id = ${req.user.id}
    `;
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user[0].total_earned < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    const pendingWithdrawal = await sql`
      SELECT * FROM withdrawals WHERE user_id = ${req.user.id} AND status = 'pending'
    `;
    
    if (pendingWithdrawal.length > 0) {
      return res.status(400).json({ error: 'You already have a pending withdrawal request' });
    }
    
    const newBalance = user[0].total_earned - amount;
    await sql`
      UPDATE users SET total_earned = ${newBalance}
      WHERE id = ${req.user.id}
    `;
    
    const withdrawal = await sql`
      INSERT INTO withdrawals (user_id, amount, method, details, status)
      VALUES (${req.user.id}, ${amount}, ${method}, ${JSON.stringify(details)}, 'pending')
      RETURNING *
    `;
    
    res.json({ 
      withdrawal: withdrawal[0],
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/withdrawals', authenticateToken, async (req, res) => {
  try {
    const withdrawals = await sql`
      SELECT * FROM withdrawals WHERE user_id = ${req.user.id} ORDER BY created_at DESC
    `;
    res.json(withdrawals);
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/withdrawals', authenticateToken, isAdmin, async (req, res) => {
  try {
    const withdrawals = await sql`
      SELECT w.*, u.email, u.total_earned, u.subscription_type
      FROM withdrawals w 
      JOIN users u ON w.user_id = u.id 
      ORDER BY w.created_at DESC
    `;
    res.json(withdrawals);
  } catch (error) {
    console.error('Get admin withdrawals error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/withdrawal/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    const withdrawal = await sql`SELECT * FROM withdrawals WHERE id = ${req.params.id}`;
    
    if (withdrawal.length === 0) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    if (status === 'rejected') {
      await sql`
        UPDATE users SET total_earned = total_earned + ${withdrawal[0].amount}
        WHERE id = ${withdrawal[0].user_id}
      `;
    }
    
    await sql`
      UPDATE withdrawals SET status = ${status}
      WHERE id = ${req.params.id}
    `;
    
    res.json({ message: 'Withdrawal updated' });
  } catch (error) {
    console.error('Update withdrawal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= MESSAGES =============

app.post('/api/admin/message', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId, message } = req.body;
    await sql`
      INSERT INTO messages (user_id, admin_message)
      VALUES (${userId}, ${message})
    `;
    res.json({ message: 'Message sent' });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await sql`
      SELECT * FROM messages WHERE user_id = ${req.user.id} ORDER BY created_at DESC
    `;
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/message/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM messages WHERE id = ${req.params.id}`;
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= USER MANAGEMENT =============

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await sql`
      SELECT id, email, phone, gender, subscription_type, role, is_banned, total_earned, created_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/user/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM users WHERE id = ${req.params.id}`;
    res.json({ message: 'User banned and deleted' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await sql`
      SELECT id, email, phone, gender, subscription_type, total_earned, created_at 
      FROM users WHERE id = ${req.user.id}
    `;
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/send-money', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId, amount } = req.body;
    await sql`
      UPDATE users SET total_earned = total_earned + ${amount}
      WHERE id = ${userId}
    `;
    res.json({ message: `Successfully sent ${amount} to user` });
  } catch (error) {
    console.error('Send money error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= KEEP-ALIVE =============

const keepAlive = async () => {
  try {
    const response = await fetch(`http://localhost:${PORT}/api/jobs`);
    console.log('🔄 Keep-alive ping at:', new Date().toISOString(), 'Status:', response.status);
  } catch (err) {
    console.log('Keep-alive error:', err.message);
  }
};

setInterval(keepAlive, 240000);

// ============= START SERVER =============

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔐 Admin login: admin@ailigner.com / Admin123!`);
  console.log(`☁️ Cloudinary configured - PDFs and images supported (PUBLIC access)`);
});