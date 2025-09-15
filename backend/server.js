// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
// Use Render's dynamic port or fallback to 5000
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '..', 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public/uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  },
});

// MongoDB Connection with detailed error handling
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', {
      message: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack,
    });
    process.exit(1); // Exit if connection fails
  });

// User Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// Donation Item Model
const itemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  condition: { type: String, required: true },
  imageUrl: { type: String, default: null }, // Ensure default is null
  donor: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
  },
  status: { type: String, default: 'available' },
  createdAt: { type: Date, default: Date.now },
});
const Item = mongoose.model('Item', itemSchema);

// Request Model
const requestSchema = new mongoose.Schema({
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Request = mongoose.model('Request', requestSchema);

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Routes
app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ userId: user._id, message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { _id: user._id, name: user.name, email: user.email }, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.post('/api/donations', authMiddleware, upload.single('image'), async (req, res) => {
  const { title, description, category, condition, donorName, email, mobile } = req.body;
  if (!title || !description || !category || !condition || !donorName || !email || !mobile) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const item = new Item({
      userId: req.user,
      title,
      description,
      category,
      condition,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      donor: { name: donorName, email, mobile },
    });
    await item.save();
    res.status(201).json({ success: true, message: 'Item donated successfully', data: item });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.get('/api/donations', async (req, res) => {
  const { status = 'available', page = 1, limit = 10, category = '', search = '' } = req.query;
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = { status };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    const items = await Item.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.post('/api/donations/:id/request', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const request = new Request({
      donationId: id,
      requesterId: req.user,
      message: req.body.message || 'Request for item',
    });
    await request.save();

    res.json({
      success: true,
      data: {
        email: item.donor.email,
        mobile: item.donor.mobile,
      },
      message: 'Donor contact information retrieved successfully',
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.delete('/api/donations/:id', authMiddleware, async (req, res) => {
  const { password } = req.body;
  const { id } = req.params;
  if (!password) return res.status(400).json({ error: 'Password required' });

  try {
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.userId.toString() !== req.user) return res.status(403).json({ error: 'Unauthorized: You can only delete your own items' });

    const user = await User.findById(req.user);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

    if (item.imageUrl) {
      const imagePath = path.join(__dirname, '..', 'public', item.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await item.deleteOne();
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const users = await User.countDocuments();
    const totalItems = await Item.countDocuments();
    const availableItems = await Item.countDocuments({ status: 'available' });
    const avgResponse = await Request.aggregate([
      { $match: { requesterId: { $exists: true } } },
      { $group: { _id: null, avgTime: { $avg: { $subtract: [new Date(), '$createdAt'] } } } },
    ]);
    res.json({
      success: true,
      users,
      totalItems,
      availableItems,
      avgResponse: avgResponse[0]?.avgTime ? (avgResponse[0].avgTime / (1000 * 60 * 60)).toFixed(2) : '0.00', // Hours
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

app.get('/api/recent-activity', authMiddleware, async (req, res) => {
  try {
    const donations = await Item.find({ status: 'available' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title category createdAt donor.name imageUrl')
      .lean()
      .then(items => items.map(item => ({
        type: 'donation',
        title: item.title,
        category: item.category,
        createdAt: item.createdAt,
        userName: item.donor.name,
        imageUrl: item.imageUrl, // Include imageUrl
      })));

    const requests = await Request.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('donationId', 'title imageUrl')
      .populate('requesterId', 'name')
      .lean()
      .then(reqs => reqs.map(req => ({
        type: 'request',
        title: req.donationId.title,
        createdAt: req.createdAt,
        userName: req.requesterId.name,
        imageUrl: req.donationId.imageUrl, // Include imageUrl
      })));

    const activities = [...donations, ...requests]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({ success: true, data: activities });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

const checkAuthHtml = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.redirect('/login.html');
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.redirect('/login.html');
  }
};

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'signup.html')));
app.get('/dashboard', checkAuthHtml, (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html')));
app.get('/donate', checkAuthHtml, (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'donate.html')));
app.get('/browse', checkAuthHtml, (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'browse.html')));

app.get('*', (req, res) => res.status(404).send('Page not found'));

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
