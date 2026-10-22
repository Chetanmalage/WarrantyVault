const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    emailReminders: { type: Boolean, default: true },
    reminderDays: { type: Number, default: 30, min: 1, max: 90 },
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id, name: this.name, email: this.email, role: this.role,
    emailReminders: this.emailReminders, reminderDays: this.reminderDays,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);