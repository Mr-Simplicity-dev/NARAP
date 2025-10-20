const SystemLimits = require('../models/SystemLimits');
const User = require('../models/User');
const Certificate = require('../models/Certificate');

// Initialize or get system limits
const getOrCreateLimits = async () => {
  let limits = await SystemLimits.findOne();
  if (!limits) {
    limits = new SystemLimits({
      memberLimit: 1415,        // 🔧 CHANGE THIS NUMBER TO INCREASE MEMBER LIMIT
      certificateLimit: 1415,   // 🔧 CHANGE THIS NUMBER TO INCREASE CERTIFICATE LIMIT
      isActive: true           // 🔧 SET TO FALSE TO DISABLE LIMITS
    });
    await limits.save();
    console.log('✅ System limits initialized:', {
      memberLimit: limits.memberLimit,
      certificateLimit: limits.certificateLimit
    });
  }
  return limits;
};

// Check if we can add a new member
const canAddMember = async () => {
  try {
    const limits = await getOrCreateLimits();
    
    if (!limits.isActive) {
      return { allowed: true, message: 'Limits disabled' };
    }

    const currentCount = await User.countDocuments({ isActive: { $ne: false } });
    
    if (currentCount >= limits.memberLimit) {
      return {
        allowed: false,
        message: `Member limit reached! Current: ${currentCount}, Limit: ${limits.memberLimit}`,
        currentCount,
        limit: limits.memberLimit
      };
    }

    return {
      allowed: true,
      message: `Members: ${currentCount}/${limits.memberLimit}`,
      currentCount,
      limit: limits.memberLimit,
      remaining: limits.memberLimit - currentCount
    };
  } catch (error) {
    console.error('Error checking member limits:', error);
    return { allowed: true, message: 'Error checking limits, allowing operation' };
  }
};

// Check if we can add a new certificate
const canAddCertificate = async () => {
  try {
    const limits = await getOrCreateLimits();
    
    if (!limits.isActive) {
      return { allowed: true, message: 'Limits disabled' };
    }

    const currentCount = await Certificate.countDocuments({ status: { $ne: 'revoked' } });
    
    if (currentCount >= limits.certificateLimit) {
      return {
        allowed: false,
        message: `Certificate limit reached! Current: ${currentCount}, Limit: ${limits.certificateLimit}`,
        currentCount,
        limit: limits.certificateLimit
      };
    }

    return {
      allowed: true,
      message: `Certificates: ${currentCount}/${limits.certificateLimit}`,
      currentCount,
      limit: limits.certificateLimit,
      remaining: limits.certificateLimit - currentCount
    };
  } catch (error) {
    console.error('Error checking certificate limits:', error);
    return { allowed: true, message: 'Error checking limits, allowing operation' };
  }
};

module.exports = {
  canAddMember,
  canAddCertificate,
  getOrCreateLimits
};