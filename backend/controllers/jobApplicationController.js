import JobApplication from '../models/JobApplication.js';

const allowedTransitions = {
  'Applied': ['Interview', 'Rejected'],
  'Interview': ['Offer', 'Rejected'],
  'Offer': ['Accepted', 'Declined'],
  'Rejected': [],
  'Accepted': [],
  'Declined': []
};

const terminalStates = ['Rejected', 'Accepted', 'Declined'];

const buildOverdueFlag = (app) => {
  const appObj = app.toObject ? app.toObject() : app;
  if (app.status === 'Applied') {
    const now = new Date();
    const followUp = new Date(app.followUpDate);
    appObj.isOverdue = now > followUp;
  } else {
    appObj.isOverdue = false;
  }
  return appObj;
};

export const getAllApplications = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.companyName = { $regex: search, $options: 'i' };
    }
    
    const applications = await JobApplication.find(filter).sort({ createdAt: -1 });
    
    const statusAgg = await JobApplication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
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
    
    statusAgg.forEach(item => {
      counts[item._id] = item.count;
    });
    
    const enriched = applications.map(buildOverdueFlag);
    
    return res.status(200).json({
      success: true,
      message: 'Applications fetched successfully',
      data: { applications: enriched, counts }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
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
    
    return res.status(200).json({
      success: true,
      message: 'Application fetched successfully',
      data: buildOverdueFlag(application)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      data: null
    });
  }
};

const assignApplicationId = async (company) => {
  const prefix = company.trim().substring(0, 3).toUpperCase();
  const pattern = new RegExp(`^JA-${prefix}-\\d{3}$`);
  const matches = await JobApplication.find({ applicationId: pattern });
  
  let max = 0;
  matches.forEach(m => {
    const parts = m.applicationId.split('-');
    if (parts.length === 3) {
      const num = parseInt(parts[2]);
      if (!isNaN(num) && num > max) max = num;
    }
  });
  
  return `JA-${prefix}-${String(max + 1).padStart(3, '0')}`;
};

export const createApplication = async (req, res) => {
  try {
    const { companyName, jobRole, jobType, appliedDate, expectedSalary, notes } = req.body;
    
    if (!companyName || !jobRole || !jobType || !appliedDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        data: null
      });
    }
    
    const appDate = new Date(appliedDate);
    const today = new Date();
    const appDateOnly = new Date(appDate.getFullYear(), appDate.getMonth(), appDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (appDateOnly > todayOnly) {
      return res.status(400).json({
        success: false,
        message: 'Applied date cannot be a future date',
        data: null
      });
    }
    
    const duplicate = await JobApplication.findOne({
      companyName: { $regex: `^${companyName.trim()}$`, $options: 'i' },
      jobRole: { $regex: `^${jobRole.trim()}$`, $options: 'i' },
      status: { $nin: terminalStates }
    });
    
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'An active application for this company and job role already exists',
        data: null
      });
    }
    
    const newId = await assignApplicationId(companyName);
    const followUp = new Date(appDate);
    followUp.setDate(followUp.getDate() + 7);
    
    const created = await JobApplication.create({
      applicationId: newId,
      companyName: companyName.trim(),
      jobRole: jobRole.trim(),
      jobType,
      appliedDate: appDate,
      expectedSalary: expectedSalary !== undefined && expectedSalary !== '' ? Number(expectedSalary) : undefined,
      notes: notes ? notes.trim() : undefined,
      status: 'Applied',
      followUpDate: followUp,
      statusHistory: [{ status: 'Applied', dateTime: new Date() }]
    });
    
    return res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: buildOverdueFlag(created)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      data: null
    });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status: nextStatus } = req.body;
    const application = await JobApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        data: null
      });
    }
    
    const current = application.status;
    const permitted = allowedTransitions[current] || [];
    
    if (!permitted.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${current} to ${nextStatus}`,
        data: null
      });
    }
    
    application.status = nextStatus;
    application.statusHistory.push({ status: nextStatus, dateTime: new Date() });
    await application.save();
    
    return res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: buildOverdueFlag(application)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      data: null
    });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        data: null
      });
    }
    
    const { companyName, jobRole, jobType, expectedSalary, notes } = req.body;
    
    if (companyName) application.companyName = companyName.trim();
    if (jobRole) application.jobRole = jobRole.trim();
    if (jobType) application.jobType = jobType;
    if (expectedSalary !== undefined) {
      application.expectedSalary = expectedSalary === '' ? undefined : Number(expectedSalary);
    }
    if (notes !== undefined) {
      application.notes = notes === '' ? undefined : notes.trim();
    }
    
    await application.save();
    
    return res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      data: buildOverdueFlag(application)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
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
    
    if (application.status === 'Interview' || application.status === 'Offer') {
      return res.status(400).json({
        success: false,
        message: 'Applications in Interview or Offer status cannot be deleted',
        data: null
      });
    }
    
    await JobApplication.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
      data: null
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      data: null
    });
  }
};

