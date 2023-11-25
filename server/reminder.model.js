import mongoose, { Schema } from 'mongoose';
const reminderSchema = new Schema({
    description: {
        type: String,
        required: true,
    },
    scheduledFor: {
        type: Date,
        required: true,
    },
    notified: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no',
    },
}, { timestamps: true });
const ReminderModel = mongoose.model('reminder', reminderSchema);
export { ReminderModel };
