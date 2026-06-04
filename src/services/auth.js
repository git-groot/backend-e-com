import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

// ✅ Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, existingUser.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // ✅ SuperAdmin — first time (2FA not setup)
        if (existingUser.role === 'SuperAdmin' && !existingUser.twoFactorEnabled) {
            const tempToken = jwt.sign(
                { id: existingUser._id },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );
            return res.status(200).json({
                requires2FA: true,
                isFirstTime: true,
                tempToken,
            });
        }

        // ✅ SuperAdmin — 2FA already setup
        if (existingUser.role === 'SuperAdmin' && existingUser.twoFactorEnabled) {
            const tempToken = jwt.sign(
                { id: existingUser._id },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );
            return res.status(200).json({
                requires2FA: true,
                isFirstTime: false,
                tempToken,
            });
        }

        // ✅ Admin or User — normal login
        const token = jwt.sign(
            { id: existingUser._id, email: existingUser.email, role: existingUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            data: {
                _id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role,
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

// ✅ Register
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: req.body.role
        });

        return res.status(201).json({
            message: "User registered successfully",
            data: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

// ✅ Verify 2FA
export const verify2FA = async (req, res) => {
    try {
        const { tempToken, otp } = req.body;

        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        const existingUser = await User.findById(decoded.id);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!existingUser.twoFactorSecret) {
            return res.status(400).json({ message: "2FA not setup. Please setup first." });
        }

        const isValid = speakeasy.totp.verify({
            secret: existingUser.twoFactorSecret,
            encoding: 'base32',
            token: otp,
            window: 1,
        });

        if (!isValid) {
            return res.status(401).json({ message: "Invalid OTP. Please try again." });
        }

        const token = jwt.sign(
            { id: existingUser._id, email: existingUser.email, role: existingUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: "2FA verified successfully",
            token,
            data: {
                _id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role,
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

// ✅ Setup 2FA
export const setup2FA = async (req, res) => {
    try {
        const userId = req.user.id

        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (existingUser.role !== 'SuperAdmin') {
            return res.status(403).json({ message: "Access denied" });
        }

        // ✅ Already setup — regenerate QR from existing secret
        // (handles page refresh on setup-2fa page)
        if (existingUser.twoFactorEnabled && existingUser.twoFactorSecret) {
            const otpauthUrl = speakeasy.otpauthURL({
                secret: existingUser.twoFactorSecret,
                label: `SouledStore (${existingUser.email})`,
                encoding: 'base32',
            });
            const qrCodeImage = await qrcode.toDataURL(otpauthUrl);
            return res.status(200).json({
                message: "2FA already setup. Here is your existing QR code.",
                qrCode: qrCodeImage,
                secret: existingUser.twoFactorSecret
            });
        }

        // ✅ First time — generate new secret
        const secret = speakeasy.generateSecret({
            name: `SouledStore (${existingUser.email})`
        });

        await User.findByIdAndUpdate(userId, {
            twoFactorSecret: secret.base32,
            twoFactorEnabled: true,
        });

        const qrCodeImage = await qrcode.toDataURL(secret.otpauth_url);

        return res.status(200).json({
            message: "2FA setup successful.",
            qrCode: qrCodeImage,
            secret: secret.base32
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

// ✅ Authenticate middleware
export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' })
        }

        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()

    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
}

// ✅ Authorize middleware
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' })
        }
        next()
    }
}