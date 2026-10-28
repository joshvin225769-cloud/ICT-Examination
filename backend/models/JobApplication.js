import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['Applied', 'Interview', 'Rejected', 'Offer', 'Accepted', 'Declined']
  },
  dateTime: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const jobApplicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    unique: true,
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  jobRole: {
    type: String,
    required: true,
    trim: true
  },
  jobType: {
    type: String,
    required: true,
    enum: ['Full-time', 'Internship', 'Contract']
  },
  appliedDate: {
    type: Date,
    required: true
  },
  expectedSalary: {
    type: Number,
    required: false
  },
  notes: {
    type: String,
    required: false,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Applied', 'Interview', 'Rejected', 'Offer', 'Accepted', 'Declined'],
    default: 'Applied'
  },
  followUpDate: {
    type: Date,
    required: true
  },
  statusHistory: {
    type: [statusHistorySchema],
    default: []
  }
}, {
  timestamps: true
});

jobApplicationSchema.methods.getIsOverdue = function() {
  if (this.status !== 'Applied') {
    return false;
  }
  const now = new Date();
  const followUp = new Date(this.followUpDate);
  // Set both to start of day for comparison? The requirement says "If the application is still in Applied status after that date"
  // "after that date" means if current date is past followUpDate
  if (now > followUp) {
    return true;
  }
  return false;
};

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

export default JobApplication;
