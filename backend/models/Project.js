const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        default: '',
        trim: true,
        index: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Residential', 'Commercial', 'Interior', 'Renovation'],
        default: 'Residential',
        index: true
    },
    location: {
        type: String,
        default: '',
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
    images: {
        type: [{
            type: String,
            trim: true
        }],
        validate: [
            function(val) {
                return Array.isArray(val) && val.length > 0;
            },
            'At least one image URL is required'
        ]
    }
}, {
    timestamps: true
});

projectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
