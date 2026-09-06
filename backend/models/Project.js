const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        index: true
    },
    category: {
        type: String,
        enum: ['Residential', 'Commercial', 'Interior', 'Renovation'],
        default: 'Residential',
        index: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    status: {
        type: String,
        enum: ['Ongoing', 'Completed', 'Upcoming'],
        default: 'Completed',
        index: true
    },
    images: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
