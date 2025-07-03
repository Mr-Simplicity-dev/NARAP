// File: api/server.js

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt'); // Added bcrypt dependency
require('dotenv').config();

const app = express();

// Middleware - must come before static file serving
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from 'public' directory with caching
app.use(
  express.static(path.join(__dirname, '..', 'public'), {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (/\.(png|jpg|jpeg|gif|ico|webp|svg)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days for images
      } else if (/\.(css|js)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days for CSS/JS
      }
    },
  })
);

// Function to connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  console.log('Connecting to MongoDB at:', process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    bufferCommands: false,
  });
  console.log('MongoDB connected successfully.');
  return mongoose.connection;
}

// ==================== ROUTES TO SERVE HTML PAGES ====================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// ==================== API ROUTES ====================

// Authentication
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === 'Admin@gmail.com' && password === 'Password') {
      res.json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
app.get('/api/getUsers', async (req, res) => {
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
      updatedAt: user.updatedAt,
    }));
    res.json(formattedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// ==================== ADMIN PANEL ENDPOINTS ====================
// Get all users
app.get('/api/getUsers', async (req, res) => {
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

// ==================== ERROR HANDLING ====================
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



// Endpoint to fetch member registration trend by month/year
app.get('/api/members/history', async (req, res) => {
  try {
    const members = await User.find({}, { createdAt: 1 });
    const history = {};

    members.forEach(user => {
      const date = new Date(user.createdAt);
      const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;

      if (!history[monthYear]) {
        history[monthYear] = 0;
      }
      history[monthYear]++;
    });

    res.json(history);
  } catch (err) {
    console.error('Error fetching member registration history:', err);
    res.status(500).json({ message: 'Server error while loading member history' });
  }
});

app.get('/api/system/health', async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const healthData = {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        limit: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      timestamp: new Date().toISOString()
    };

    res.json(healthData);
  } catch (error) {
    console.error('System health check failed:', error);
    res.status(500).json({ message: 'Error checking system health' });
  }
});

// Catch-all for client-side routing (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ==================== DATABASE MODELS ====================
const userSchema = new mongoose.Schema({ /* … your schema … */ });
const User = mongoose.model('User', userSchema);

const certificateSchema = new mongoose.Schema({ /* … your schema … */ });
const Certificate = mongoose.model('Certificate', certificateSchema);

// ==================== LOCAL DEVELOPMENT SERVER ====================
// Only start the HTTP listener when NOT deploying on Vercel
if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      const port = process.env.PORT || 3000;
      app.listen(port, () =>
        console.log(`✅  Dev server listening on http://localhost:${port}`)
      );
    })
    .catch(err => {
      console.error('❌ DB connection failed:', err);
      process.exit(1);
    });
}

// Export the raw Express app and the connectDB helper
module.exports = { app, connectDB };
