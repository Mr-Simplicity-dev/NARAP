// File: api/server.js
const express = require('express');
const mongoose = require('mongoose');
const serverless = require('serverless-http');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();



// Allow your front-end origin(s) to talk to this API
app.use(cors({
  origin: [
    'https://www.narapdb.com.ng',
    'http://localhost:3000'
  ],
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));


// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (/\.(png|jpg|jpeg|gif|ico|webp|svg)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    }
    else if (/\.(css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  }
}));

// Database Connection
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    throw err;
  }
};

// Database Models
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  position: {
    type: String,
    required: true,
    enum: [
      'PRESIDENT', 'DEPUTY PRESIDENT', 'WELFARE', 'PUBLIC RELATION OFFICER',
      'STATE WELFARE COORDINATOR', 'MEMBER', 'TASK FORCE', 'PROVOST MARSHAL 1',
      'PROVOST MARSHAL 2', 'VICE PRESIDENT (South West)', 'VICE PRESIDENT (South East)',
      'VICE PRESIDENT (South South)', 'VICE PRESIDENT (North West)', 'VICE PRESIDENT (North Central)',
      'VICE PRESIDENT (North East)', 'PUBLIC RELATION OFFICE', 'FINANCIAL SECRETARY',
      'SECRETARY', 'ASSISTANT SECRETARY', 'TREASURER', 'COORDINATOR', 'ASSISTANT FINANCIAL SECRETARY'
    ],
    default: 'MEMBER'
  },
  state: { type: String, required: true },
  zone: { type: String, required: true },
  passportPhoto: { type: String },
  signature: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  cardGenerated: { type: Boolean, default: false },
  dateAdded: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.index({ code: 1 });
userSchema.index({ email: 1 });
userSchema.index({ state: 1 });
userSchema.index({ position: 1 });

const certificateSchema = new mongoose.Schema({
  number: { type: String, required: [true, 'Certificate number is required'], unique: true, uppercase: true, trim: true },
  recipient: { type: String, required: [true, 'Recipient name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], lowercase: true, trim: true,
    validate: { validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: 'Please enter a valid email address' }
  },
  title: { type: String, required: [true, 'Certificate title is required'], trim: true },
  type: { type: String, required: true, enum: { values: ['membership', 'training', 'achievement', 'recognition', 'service'], message: 'Invalid certificate type' }, default: 'membership' },
  description: { type: String, trim: true },
  issueDate: { type: Date, required: [true, 'Issue date is required'], default: Date.now },
  validUntil: { type: Date, validate: { validator: v => !v || v > this.issueDate, message: 'Valid until date must be after issue date' } },
  status: { type: String, enum: { values: ['active', 'revoked', 'expired'], message: 'Invalid certificate status' }, default: 'active' },
  revokedAt: { type: Date },
  revokedBy: { type: String },
  revokedReason: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issuedBy: { type: String, default: 'NARAP Admin System' },
  serialNumber: { type: String, unique: true }
}, { timestamps: true });

certificateSchema.pre('save', function(next) {
  if (!this.serialNumber) {
    this.serialNumber = `NARAP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
  next();
});

certificateSchema.index({ number: 1 });
certificateSchema.index({ email: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ recipient: 1 });
certificateSchema.index({ serialNumber: 1 });

const User = mongoose.model('User', userSchema);
const Certificate = mongoose.model('Certificate', certificateSchema);

// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================

// HTML Routes
    app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });

    app.get('/admin', authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
    });

    app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });

// Authentication Endpoints


app.post('/api/login', async (req, res) => {
  try {
    // Debugging log
    console.log('Login attempt received');
    
    await connectDB();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Temporary admin bypass (remove in production)
    if (email === 'Admin@gmail.com' && password === 'Password') {
      const token = jwt.sign(
        { userId: 'admin', role: 'admin' },
        process.env.JWT_SECRET || 'development-secret',
        { expiresIn: '1h' }
      );
      return res.json({ 
        success: true,
        token,
        user: { email: 'Admin@gmail.com', role: 'admin' }
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.position },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );

    console.log('Successful login for:', email);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.position
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Admin Panel Endpoints (protected with authenticate middleware)
app.get('/api/getUsers', authenticate, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ dateAdded: -1 });
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      code: user.code,
      position: user.position,
      state: user.state,
      zone: user.zone,
      passportPhoto: user.passportPhoto,
      signature: user.signature,
      dateAdded: user.dateAdded || user.createdAt,
      isActive: user.isActive,
      cardGenerated: user.cardGenerated,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    res.json(formattedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// [Keep all your existing endpoints exactly as they were, just add authenticate middleware to protected routes]
// Add user
app.post('/api/addUser', async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            code,
            position = 'MEMBER',
            state,
            zone,
            passportPhoto,
            signature
        } = req.body;
        
        // Validation
        if (!name || !email || !password || !code || !state || !zone) {
            return res.status(400).json({
                message: 'All required fields must be provided'
            });
        }
        
        // Check if code already exists
        const existingCode = await User.findOne({ code: code.toUpperCase() });
        if (existingCode) {
            return res.status(400).json({ message: 'Code already exists' });
        }
        
        // Check if email already exists
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            code: code.toUpperCase().trim(),
            position,
            state: state.trim(),
            zone: zone.trim(),
            dateAdded: new Date(),
            cardGenerated: !!(passportPhoto && signature)
        };
        
        // Add images if provided
        if (passportPhoto) {
            userData.passportPhoto = passportPhoto;
        }
        
        if (signature) {
            userData.signature = signature;
        }
        
        const user = new User(userData);
        await user.save();
        
        res.json({ message: 'User added successfully' });
    } catch (error) {
        console.error('Add user error:', error);
        if (error.code === 11000) {
            if (error.keyPattern.email) {
                res.status(400).json({ message: 'Email already exists' });
            } else if (error.keyPattern.code) {
                res.status(400).json({ message: 'Code already exists' });
            } else {
                res.status(400).json({ message: 'Duplicate entry found' });
            }
        } else if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            res.status(400).json({ message: messages.join(', ') });
        } else {
            res.status(500).json({ message: 'Server error while adding user' });
        }
    }
});

// Delete single user
app.delete('/api/deleteUser/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error while deleting user' });
    }
});

// Delete all users
app.delete('/api/deleteAllUsers', async (req, res) => {
    try {
        const result = await User.deleteMany({});
        
        res.json({ 
            message: `All users deleted successfully. ${result.deletedCount} users removed.`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Delete all users error:', error);
        res.status(500).json({ message: 'Server error while deleting all users' });
    }
});

// Update user
app.put('/api/updateUser/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        // Remove sensitive fields
        delete updateData.password;
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        
        // If code is being updated
        if (updateData.code) {
            updateData.code = updateData.code.toUpperCase().trim();
            const existingCode = await User.findOne({
                code: updateData.code,
                _id: { $ne: id }
            });
            if (existingCode) {
                return res.status(400).json({ message: 'Code already exists' });
            }
        }
        
        // Update cardGenerated status
        if (updateData.passportPhoto && updateData.signature) {
            updateData.cardGenerated = true;
        }
        
        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error('Update user error:', error);
        if (error.code === 11000) {
            res.status(400).json({ message: 'Duplicate entry found' });
        } else if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            res.status(400).json({ message: messages.join(', ') });
        } else {
            res.status(500).json({ message: 'Server error while updating user' });
        }
    }
});

// ==================== FRONTEND VERIFICATION ENDPOINTS ====================
// Member verification
app.post('/api/members/verify', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Code is required' });
    const member = await User.findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') }, isActive: { $ne: false } }).select('-password');
    if (!member) {
      console.log('❌ Member not found for code:', code);
      return res.status(404).json({ success: false, message: 'Member not found with this code. Please verify the code and try again.' });
    }
    member.lastVerification = new Date();
    await member.save();
    res.json({
      success: true,
      message: 'Member found successfully',
      member: {
        _id: member._id,
        name: member.name,
        email: member.email,
        code: member.code,
        position: member.position || 'MEMBER',
        state: member.state,
        zone: member.zone,
        passportPhoto: member.passportPhoto,
        signature: member.signature,
        dateAdded: member.dateAdded || member.createdAt,
        isActive: member.isActive !== false
      }
    });
  } catch (error) {
    console.error('❌ Member verification error:', error);
    res.status(500).json({ success: false, message: 'Server error while verifying member' });
  }
});

// Certificate verification (single implementation)
app.post('/api/certificates/verify', async (req, res) => {
    try {
        const { certificateNumber } = req.body;
        
        console.log('🔍 Frontend certificate verification request for:', certificateNumber);
        
        if (!certificateNumber) {
            return res.status(400).json({ 
                success: false,
                message: 'Certificate number is required' 
            });
        }
        
        // Search for certificate by number (case insensitive)
        const certificate = await Certificate.findOne({ 
            number: { $regex: new RegExp(`^${certificateNumber}$`, 'i') }
        }).populate('userId', 'name email code');
        
        if (!certificate) {
            console.log('❌ Certificate not found for number:', certificateNumber);
            return res.status(404).json({ 
                success: false,
                message: 'Certificate not found with this number. Please verify the certificate number and try again.' 
            });
        }
        
        // Check if certificate is expired
        let status = certificate.status;
        if (certificate.validUntil && new Date() > certificate.validUntil && status === 'active') {
            status = 'expired';
            certificate.status = 'expired';
            await certificate.save();
        }
        
        console.log('✅ Certificate found:', certificate.number, status);
        
        res.json({
            success: true,
            message: 'Certificate verified successfully',
            certificate: {
                _id: certificate._id,
                certificateNumber: certificate.number,
                recipientName: certificate.recipient,
                title: certificate.title,
                type: certificate.type,
                description: certificate.description,
                dateIssued: certificate.issueDate || certificate.createdAt,
                validUntil: certificate.validUntil,
                status: status,
                issuedBy: certificate.issuedBy || 'NARAP Authority',
                revokedAt: certificate.revokedAt,
                revokedReason: certificate.revokedReason
            }
        });
    } catch (error) {
        console.error('❌ Certificate verification error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while verifying certificate' 
        });
    }
});

// Legacy searchUser endpoint
app.post('/api/searchUser', async (req, res) => {
    try {
        const { code } = req.body;
        
        console.log('🔍 Legacy searchUser request for code:', code);
        
        if (!code) {
            return res.status(400).json({ message: 'Code is required' });
        }
        
        const user = await User.findOne({ 
            code: { $regex: new RegExp(`^${code}$`, 'i') },
            isActive: { $ne: false }
        }).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                code: user.code,
                position: user.position || 'MEMBER',
                state: user.state,
                zone: user.zone,
                passportPhoto: user.passportPhoto || user.passport,
                signature: user.signature,
                dateAdded: user.dateAdded || user.createdAt,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Legacy searchUser error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== CERTIFICATE MANAGEMENT ENDPOINTS ====================
// Logging middleware
app.use('/api/certificates', (req, res, next) => {
    console.log(`📋 Certificate API: ${req.method} ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', req.body);
    }
    next();
});

// Get all certificates
app.get('/api/certificates', async (req, res) => {
    try {
        const certificates = await Certificate.find()
            .populate('userId', 'name email code')
            .sort({ createdAt: -1 });
        
        res.json(certificates);
    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({ message: 'Server error while fetching certificates' });
    }
});

// Issue new certificate
app.post('/api/certificates', async (req, res) => {
    try {
        const {
            number,
            recipient,
            email,
            title,
            type = 'membership',
            description,
            issueDate,
            validUntil,
            userId
        } = req.body;
        
        // Validation
        if (!number || !recipient || !email || !title) {
            return res.status(400).json({
                message: 'Certificate number, recipient, email, and title are required'
            });
        }
        
        // Check if certificate number already exists
        const existingCert = await Certificate.findOne({ 
            number: number.toUpperCase() 
        });
        if (existingCert) {
            return res.status(400).json({ 
                message: 'Certificate number already exists' 
            });
        }
        
        const certificateData = {
            number: number.toUpperCase().trim(),
            recipient: recipient.trim(),
            email: email.toLowerCase().trim(),
            title: title.trim(),
            type,
            description: description?.trim(),
            issueDate: issueDate ? new Date(issueDate) : new Date(),
            validUntil: validUntil ? new Date(validUntil) : null,
            userId: userId || null
        };
        
        const certificate = new Certificate(certificateData);
        await certificate.save();
        
        res.status(201).json({
            message: 'Certificate issued successfully',
            certificate
        });
    } catch (error) {
        console.error('Issue certificate error:', error);
        if (error.code === 11000) {
            res.status(400).json({ message: 'Certificate number already exists' });
        } else if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            res.status(400).json({ message: messages.join(', ') });
        } else {
            res.status(500).json({ message: 'Server error while issuing certificate' });
        }
    }
});

// Get certificate by ID
app.get('/api/certificates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid certificate ID format' });
        }
        
        const certificate = await Certificate.findById(id)
            .populate('userId', 'name email code');
        
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        
        res.json(certificate);
    } catch (error) {
        console.error('Get certificate error:', error);
        res.status(500).json({ message: 'Server error while fetching certificate' });
    }
});

// Verify certificate by number
app.get('/api/certificates/verify/:number', async (req, res) => {
    try {
        const { number } = req.params;
        
        const certificate = await Certificate.findOne({ 
            number: number.toUpperCase(),
            status: 'active'
        }).populate('userId', 'name email code');
        
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found or inactive' });
        }
        
        // Check if certificate is expired
        if (certificate.validUntil && new Date() > certificate.validUntil) {
            certificate.status = 'expired';
            await certificate.save();
            return res.status(400).json({ message: 'Certificate has expired' });
        }
        
        res.json({
            message: 'Certificate is valid',
            certificate
        });
    } catch (error) {
        console.error('Verify certificate error:', error);
        res.status(500).json({ message: 'Server error while verifying certificate' });
    }
});

// Revoke certificate
app.put('/api/certificates/:id/revoke', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, revokedBy = 'Admin' } = req.body;
        
        console.log(`Revoking certificate ${id} with reason: ${reason}`);
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid certificate ID format' });
        }
        
        const certificate = await Certificate.findByIdAndUpdate(
            id,
            {
                status: 'revoked',
                revokedAt: new Date(),
                revokedBy,
                revokedReason: reason
            },
            { new: true }
        );
        
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        
        console.log('Certificate revoked successfully:', certificate.number);
        
        res.json({
            message: 'Certificate revoked successfully',
            certificate
        });
    } catch (error) {
        console.error('Revoke certificate error:', error);
        res.status(500).json({ message: 'Server error while revoking certificate' });
    }
});

// Delete certificate
app.delete('/api/certificates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`Deleting certificate ${id}`);
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid certificate ID format' });
        }
        
        const certificate = await Certificate.findByIdAndDelete(id);
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        
        console.log('Certificate deleted successfully:', certificate.number);
        
        res.json({ message: 'Certificate deleted successfully' });
    } catch (error) {
        console.error('Delete certificate error:', error);
        res.status(500).json({ message: 'Server error while deleting certificate' });
    }
});

// ==================== ANALYTICS ENDPOINTS ====================
app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        const totalMembers = await User.countDocuments();
        const totalCertificates = await Certificate.countDocuments();
        const activeCertificates = await Certificate.countDocuments({ status: 'active' });
        const revokedCertificates = await Certificate.countDocuments({ status: 'revoked' });
        
        // Members added this month
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        
        const newThisMonth = await User.countDocuments({
            createdAt: { $gte: thisMonth }
        });
        
        // Members by state
        const membersByState = await User.aggregate([
            { $group: { _id: '$state', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        
        // Members by position
        const membersByPosition = await User.aggregate([
            { $group: { _id: '$position', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        // Recent registrations
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentRegistrations = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);
        
        res.json({
            totalMembers,
            totalCertificates,
            activeCertificates,
            revokedCertificates,
            newThisMonth,
            membersByState,
            membersByPosition,
            recentRegistrations
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Server error while fetching analytics' });
    }
});

// Replace the existing /api/members/history endpoint in your server.js with this:

app.get('/api/members/history', async (req, res) => {
  try {
    // Ensure database connection
    const db = await connectDB();
    if (db.readyState !== 1) {
      return res.status(500).json({ 
        success: false,
        message: 'Database connection not established'
      });
    }

    // Get members grouped by month/year
    const members = await User.aggregate([
      {
        $match: {
          createdAt: { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { 
        $sort: { "_id.year": 1, "_id.month": 1 } 
      }
    ]);

    // Format the data for frontend
    const history = members.reduce((acc, curr) => {
      const key = `${curr._id.month}-${curr._id.year}`;
      acc[key] = curr.count;
      return acc;
    }, {});

    // Send successful response
    res.json({
      success: true,
      data: history,
      stats: {
        totalMonths: members.length,
        latestDate: members.length > 0 
          ? `${members[members.length-1]._id.month}-${members[members.length-1]._id.year}`
          : null
      }
    });

  } catch (err) {
    console.error('❌ Member history error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to load member history',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});

// ==================== SYSTEM HEALTH ENDPOINTS ====================
app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        
        // Get basic system info
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: dbStatus,
            uptime: Math.floor(uptime),
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
            },
            load: '0%'
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// ==================== BULK OPERATIONS ====================
app.post('/api/users/bulk-delete', async (req, res) => {
    try {
        const { userIds } = req.body;
        
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'User IDs array is required' });
        }
        
        // Validate all IDs
        const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({ 
                message: `Invalid user IDs: ${invalidIds.join(', ')}` 
            });
        }
        
        const result = await User.deleteMany({
            _id: { $in: userIds }
        });
        
        res.json({
            message: `Successfully deleted ${result.deletedCount} users`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ message: 'Server error while deleting users' });
    }
});

// ==================== FILE UPLOAD ENDPOINTS ====================
app.post('/api/upload/image', async (req, res) => {
    try {
        const { imageData, type } = req.body;
        
        if (!imageData || !type) {
            return res.status(400).json({ message: 'Image data and type are required' });
        }
        
        // Validate image type
        if (!['passport', 'signature'].includes(type)) {
            return res.status(400).json({ message: 'Invalid image type' });
        }
        
        res.json({
            message: 'Image uploaded successfully',
            imageUrl: imageData
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ message: 'Server error while uploading image' });
    }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Error Handling
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `API endpoint ${req.method} ${req.originalUrl} not found` });
});

app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  if (error.code === 11000) {
    return res.status(400).json({ message: 'Duplicate entry found' });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  res.status(500).json({ message: 'Internal server error' });
});

// Local development server
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () =>
        console.log(`🛡️  Local server listening on http://localhost:${PORT}`)
      );
    })
    .catch(err => {
      console.error('DB connection failed:', err);
      process.exit(1);
    });
}


// Ensure DB connects in serverless (Vercel) environment
connectDB()
  .then(() => console.log('💾 MongoDB connected (serverless)'))
  .catch(err => console.error('❌ MongoDB connect failed (serverless):', err));

// Export the app wrapped by serverless-http
module.exports = serverless(app);
