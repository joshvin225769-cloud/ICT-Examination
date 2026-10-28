import JobApplication from '../models/JobApplication.js';

const VALID_TRANSITIONS = {
  'Applied': ['Interview', 'Rejected'],
  'Interview': ['Offer', 'Rejected'],
  'Offer': ['Accepted', 'Declined'],
  'Rejected': [],
  'Accepted': [],
  'Declined': []
};

const FINAL_STATUSES = ['Rejected', 'Accepted', 'Declined'];

export const getAllApplications = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.companyName = { $regex: search, $options: 'i' };
    }
    
    const applications = await JobApplication.find(query).sort({ createdAt: -1 });
    
    // Calculate counts per status
    const statusCounts = await JobApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const counts = {
      all: await JobApplication.countDocuments(),
      Applied: 0,
      Interview: 0,
      Rejected: 0,
      Offer: 0,
      Accepted: 0,
      Declined: 0
    };
    
    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });
    
    const applicationsWithOverdue = applications.map(app => {
      const appObj = app.toObject();
      if (app.status === 'Applied') {
        const now = new Date();
        const followUp = new Date(app.followUpDate);
        appObj.isOverdue = now > followUp;
      } else {
        appObj.isOverdue = false;
      }
      return appObj;
    });
    
    res.status(200).json({
      success: true,
      message: 'Applications fetched successfully',
      data: {
        applications: applicationsWithOverdue,
        counts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        data: null
      });
    }
    
    const appObj = application.toObject();
    if (application.status === 'Applied') {
      const now = new Date();
      const followUp = new Date(application.followUpDate);
      appObj.isOverdue = now > followUp;
    } else {
      appObj.isOverdue = false;
    }
    
    res.status(200).json({
      success: true,
      message: 'Application fetched successfully',
      data: appObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

const generateApplicationId = async (companyName) => {
  const prefix = companyName.trim().substring(0, 3).toUpperCase();
  // Find the highest sequence number for this prefix
  const regex = new RegExp(`^JA-${prefix}-\\d{3}$`);
  const existingApps = await JobApplication.find({ applicationId: regex });
  
  let maxSequence = 0;
  existingApps.forEach(app => {
    const parts = app.applicationId.split('-');
    if (parts.length === 3) {
      const seq = parseInt(parts[2]);
      if (!isNaN(seq) && seq > maxSequence) {
        maxSequence = seq;
      }
    }
  });
  
  const nextSequence = String(maxSequence + 1).padStart(3, '0');
  return `JA-${prefix}-${nextSequence}`;
};

export const createApplication = async (req, res) => {
  try {
    const { companyName, jobRole, jobType, appliedDate, expectedSalary, notes } = req.body;
    
    // Frontend and backend validation for appliedDate not in future
    const appliedDateObj = new Date(appliedDate);
    const now = new Date();
    // Reset time to compare dates only
    const appliedDateOnly = new Date(appliedDateObj.getFullYear(), appliedDateObj.getMonth(), appliedDateObj.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (appliedDateOnly > nowOnly) {
      return res.status(400).json({
        success: false,
        message: 'Applied date cannot be a future date',
        data: null
      });
    }
    
    // Check for duplicate - same company and job role (case-insensitive) while earlier application is still active (not in final status)
    const existingActiveApp = await JobApplication.findOne({
      companyName: { $regex: new RegExp(`^${companyName.trim()}$`, 'i') },
      jobRole: { $regex: new RegExp(`^${jobRole.trim()}$`, 'i') },
      status: { $nin: FINAL_STATUSES }
    });
    
    if (existingActiveApp) {
      return res.status(409).json({
        success: false,
        message: 'An active application for this company and job role already exists',
        data: null
      });
    }
    
    // Generate application ID
    const applicationId = await generateApplicationId(companyName);
    
    // Set follow-up date to 7 days after applied date
    const followUpDate = new Date(appliedDateObj);
    followUpDate.setDate(followUpDate.getDate() + 7);
    
    // Create status history
    const statusHistory = [{
      status: 'Applied',
      dateTime: new Date()
    }];
    
    const application = await JobApplication.create({
      applicationId,
      companyName: companyName.trim(),
      jobRole: jobRole.trim(),
      jobType,
      appliedDate: appliedDateObj,
      expectedSalary: expectedSalary ? Number(expectedSalary) : undefined,
      notes: notes ? notes.trim() : undefined,
      status: 'Applied',
      followUpDate,
      statusHistory
    });
    
    const appObj = application.toObject();
    appObj.isOverdue = false; // Just created, not overdue
    
    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: appObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await JobApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        data: null
      });
    }
    
    const currentStatus = application.status;
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
    
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${status}`,
        data: null
      });
    }
    
    application.status = status;
    application.statusHistory.push({
      status: status,
      dateTime: new Date()
    });
    
    await application.save();
    
    const appObj = application.toObject();
    if (application.status === 'Applied') {
      const now = new Date();
      const followUp = new Date(application.followUpDate);
      appObj.isOverdue = now > followUp;
    } else {
      appObj.isOverdue = false;
    }
    
    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: appObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const { companyName, jobRole, jobType, expectedSalary, notes } = req.body;
    const application = await JobApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        data: null
      });
    }
    
    // Cannot edit Application ID and Applied Date
    if (companyName) application.companyName = companyName.trim();
    if (jobRole) application.jobRole = jobRole.trim();
    if (jobType) application.jobType = jobType;
    if (expectedSalary !== undefined) application.expectedSalary = expectedSalary ? Number(expectedSalary) : undefined;
    if (notes !== undefined) application.notes = notes ? notes.trim() : undefined;
    
    await application.save();
    
    const appObj = application.toObject();
    if (application.status === 'Applied') {
      const now = new Date();
      const followUp = new Date(application.followUpDate);
      appObj.isOverdue = now > followUp;
    } else {
      appObj.isOverdue = false;
    }
    
    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: appObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        data: null
      });
    }
    
    // Can delete only if status is Applied or in final status
    // Cannot delete if in Interview or Offer status
    if (application.status === 'Interview' || application.status === 'Offer') {
      return res.status(400).json({
        success: false,
        message: 'Applications in Interview or Offer status cannot be deleted',
        data: null
      });
    }
    
    await JobApplication.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};
