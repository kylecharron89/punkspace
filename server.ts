import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Render persistent disk path or local path
const DB_PATH = fs.existsSync('/data') ? '/data/punkspace.db' : 'punkspace.db';

// Resilience: If the file exists but is 0 bytes or corrupted, delete it so we can start fresh
if (fs.existsSync(DB_PATH)) {
  const stats = fs.statSync(DB_PATH);
  if (stats.size === 0) {
    console.log('Empty database file detected. Deleting to start fresh...');
    fs.unlinkSync(DB_PATH);
  }
}

let db: Database.Database;
try {
  db = new Database(DB_PATH);
} catch (err) {
  console.error('Failed to open database. It might be corrupted. Deleting and retrying...', err);
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  db = new Database(DB_PATH);
}

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    avatar_url TEXT,
    bio TEXT,
    profile_css TEXT,
    profile_html TEXT,
    top_friends TEXT, -- JSON array of user IDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    user_id INTEGER,
    content TEXT,
    type TEXT DEFAULT 'text', -- 'text' or 'image'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS board_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS board_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    user_id INTEGER,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(post_id) REFERENCES board_posts(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed default rooms
const rooms = db.prepare('SELECT * FROM rooms').all();
if (rooms.length === 0) {
  db.prepare('INSERT INTO rooms (name, description) VALUES (?, ?)').run('General', 'The main lobby for everyone.');
  db.prepare('INSERT INTO rooms (name, description) VALUES (?, ?)').run('Music', 'Share your favorite tunes and bands.');
  db.prepare('INSERT INTO rooms (name, description) VALUES (?, ?)').run('Art', 'Show off your creations.');
  db.prepare('INSERT INTO rooms (name, description) VALUES (?, ?)').run('Anarchy', 'No rules, just chaos.');
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Track online users
const onlineUsers = new Map<string, number>(); // socketId -> userId

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const userId = req.cookies.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = parseInt(userId);
  next();
};

// --- API Routes ---

// Auth
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
    res.cookie('userId', result.lastInsertRowid.toString(), { httpOnly: true, sameSite: 'none', secure: true });
    res.json({ id: result.lastInsertRowid, username });
  } catch (e) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (user && await bcrypt.compare(password, user.password)) {
    res.cookie('userId', user.id.toString(), { httpOnly: true, sameSite: 'none', secure: true });
    res.json({ id: user.id, username: user.username });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('userId');
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  const userId = req.cookies.userId;
  if (!userId) return res.json(null);
  const user: any = db.prepare('SELECT id, username, avatar_url FROM users WHERE id = ?').get(userId);
  res.json(user);
});

// Profiles
app.get('/api/users/:username', (req, res) => {
  const user: any = db.prepare('SELECT id, username, avatar_url, bio, profile_css, profile_html, top_friends, created_at FROM users WHERE username = ?').get(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Fetch actual user data for top friends
  let topFriendsData = [];
  if (user.top_friends) {
    try {
      const ids = JSON.parse(user.top_friends);
      if (ids.length > 0) {
        topFriendsData = db.prepare(`
          SELECT id, username, avatar_url 
          FROM users 
          WHERE id IN (${ids.map(() => '?').join(',')})
        `).all(...ids);
      }
    } catch (e) {
      console.error("Error parsing top friends", e);
    }
  }
  
  res.json({ ...user, top_friends_data: topFriendsData });
});

app.post('/api/friends/top', authenticate, (req: any, res) => {
  const { friendId, action } = req.body; // action: 'add' or 'remove'
  const user: any = db.prepare('SELECT top_friends FROM users WHERE id = ?').get(req.userId);
  let friends = user.top_friends ? JSON.parse(user.top_friends) : [];
  
  if (action === 'add') {
    if (!friends.includes(friendId)) {
      friends.push(friendId);
      if (friends.length > 8) friends.shift(); // Limit to top 8
    }
  } else {
    friends = friends.filter((id: number) => id !== friendId);
  }
  
  db.prepare('UPDATE users SET top_friends = ? WHERE id = ?').run(JSON.stringify(friends), req.userId);
  res.json({ success: true, friends });
});

app.put('/api/profile', authenticate, (req: any, res) => {
  const { bio, profile_css, profile_html, avatar_url } = req.body;
  db.prepare('UPDATE users SET bio = ?, profile_css = ?, profile_html = ?, avatar_url = ? WHERE id = ?')
    .run(bio, profile_css, profile_html, avatar_url, req.userId);
  res.json({ success: true });
});

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, avatar_url FROM users LIMIT 50').all();
  res.json(users);
});

// Rooms
app.get('/api/rooms', (req, res) => {
  const rooms = db.prepare('SELECT * FROM rooms').all();
  res.json(rooms);
});

// Messages
app.get('/api/rooms/:roomId/messages', (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.username, u.avatar_url 
    FROM messages m 
    JOIN users u ON m.user_id = u.id 
    WHERE m.room_id = ? 
    ORDER BY m.timestamp ASC 
    LIMIT 100
  `).all(req.params.roomId);
  res.json(messages);
});

// Board
app.get('/api/board', (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.username, u.avatar_url, (SELECT COUNT(*) FROM board_comments WHERE post_id = p.id) as comment_count
    FROM board_posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.timestamp DESC
  `).all();
  res.json(posts);
});

app.post('/api/board', authenticate, (req: any, res) => {
  const { title, content } = req.body;
  const result = db.prepare('INSERT INTO board_posts (user_id, title, content) VALUES (?, ?, ?)').run(req.userId, title, content);
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/board/:id', (req, res) => {
  const post: any = db.prepare(`
    SELECT p.*, u.username, u.avatar_url
    FROM board_posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  
  const comments = db.prepare(`
    SELECT c.*, u.username, u.avatar_url
    FROM board_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.timestamp ASC
  `).all(req.params.id);
  
  res.json({ ...post, comments });
});

app.post('/api/board/:id/comments', authenticate, (req: any, res) => {
  const { content } = req.body;
  db.prepare('INSERT INTO board_comments (post_id, user_id, content) VALUES (?, ?, ?)').run(req.params.id, req.userId, content);
  res.json({ success: true });
});

// Uploads
app.post('/api/upload', authenticate, upload.single('file'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Stats & Social
app.get('/api/stats/online', (req, res) => {
  const userIds = Array.from(new Set(onlineUsers.values()));
  if (userIds.length === 0) return res.json([]);
  
  const users = db.prepare(`
    SELECT id, username, avatar_url 
    FROM users 
    WHERE id IN (${userIds.map(() => '?').join(',')})
  `).all(...userIds);
  res.json(users);
});

app.get('/api/stats/punk-of-the-day', (req, res) => {
  // Use the current date as a seed for randomness
  const dateStr = new Date().toISOString().split('T')[0];
  const seed = dateStr.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  
  const allUsers = db.prepare('SELECT id, username, avatar_url, bio FROM users').all();
  if (allUsers.length === 0) return res.json(null);
  
  const index = seed % allUsers.length;
  res.json(allUsers[index]);
});

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', (userId) => {
    onlineUsers.set(socket.id, userId);
    io.emit('online_count_update', Array.from(new Set(onlineUsers.values())).length);
  });

  socket.on('join_room', (roomId) => {
    socket.join(`room_${roomId}`);
    console.log(`User ${socket.id} joined room_${roomId}`);
  });

  socket.on('send_message', (data) => {
    const { room_id, user_id, content, type } = data;
    const result = db.prepare('INSERT INTO messages (room_id, user_id, content, type) VALUES (?, ?, ?, ?)').run(room_id, user_id, content, type || 'text');
    
    const user: any = db.prepare('SELECT username, avatar_url FROM users WHERE id = ?').get(user_id);
    const message = {
      id: result.lastInsertRowid,
      room_id,
      user_id,
      content,
      type: type || 'text',
      timestamp: new Date().toISOString(),
      username: user.username,
      avatar_url: user.avatar_url
    };
    
    io.to(`room_${room_id}`).emit('new_message', message);
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('online_count_update', Array.from(new Set(onlineUsers.values())).length);
    console.log('User disconnected:', socket.id);
  });
});

// --- Vite Middleware ---
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'dist', 'index.html')));
  }

  httpServer.listen(3000, '0.0.0.0', () => {
    console.log('PunkSpace running on http://localhost:3000');
  });
};

startServer();
