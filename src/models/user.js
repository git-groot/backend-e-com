import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['SuperAdmin', 'Admin', 'User'],
            default: 'User',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        twoFactorSecret: {
            type: String,
            default: null,
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

const User = mongoose.model('Users', UserSchema)

export default User