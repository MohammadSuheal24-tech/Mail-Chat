import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbService } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'echochat_super_secret_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export function generateToken(user: { id: string; email: string; username: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; username: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export const authController = {
  // Register with email and password (NO phone number)
  async register(req: Request, res: Response) {
    try {
      const { email, password, username, displayName, avatarUrl } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, username, and password are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      // Check existing email
      const existingEmail = dbService.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      // Check existing username
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters (letters, numbers, underscores)' });
      }

      const existingUsername = dbService.getUserByUsername(cleanUsername);
      if (existingUsername) {
        return res.status(400).json({ error: 'This username is already taken. Please choose another.' });
      }

      // Hash password securely
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const newUser = dbService.createUser({
        email: email.trim().toLowerCase(),
        username: cleanUsername,
        displayName: (displayName && displayName.trim()) || cleanUsername,
        passwordHash,
        avatarUrl,
        verificationCode,
      });

      // Record simulated verification email
      const verificationEmail = dbService.addSimulatedEmail({
        to: newUser.email,
        type: 'verification',
        subject: 'Verify your EchoChat account',
        code: verificationCode,
        token: `verify_${verificationCode}`,
        message: `Hello ${newUser.displayName}! Your 6-digit verification code is: ${verificationCode}. Enter this code in the app to verify your email address.`,
      });

      const token = generateToken(newUser);

      return res.status(201).json({
        user: newUser,
        token,
        emailSent: {
          to: newUser.email,
          code: verificationCode,
          subject: verificationEmail.subject,
        },
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
  },

  // Login with email and password
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = dbService.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Mark online & update lastSeen
      dbService.updateUser(user.id, { isOnline: true, lastSeen: new Date().toISOString() });
      const publicUser = dbService.getUserById(user.id);
      const token = generateToken(user);

      return res.json({
        user: publicUser,
        token,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  },

  // Verify email address with 6-digit code
  async verifyEmail(req: AuthRequest, res: Response) {
    try {
      const { code } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = dbService.getUserAuthById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.isEmailVerified) {
        return res.json({ message: 'Email is already verified', user: dbService.getUserById(userId) });
      }

      if (!code || user.verificationCode !== code.trim()) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // Mark verified
      const updated = dbService.updateUser(userId, { isEmailVerified: true, verificationCode: undefined });

      return res.json({
        message: 'Email verified successfully!',
        user: updated,
      });
    } catch (err: any) {
      console.error('Email verify error:', err);
      return res.status(500).json({ error: 'Failed to verify email' });
    }
  },

  // Resend verification code
  async resendVerification(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = dbService.getUserAuthById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      dbService.updateUser(userId, { verificationCode });

      const email = dbService.addSimulatedEmail({
        to: user.email,
        type: 'verification',
        subject: 'EchoChat verification code (Resent)',
        code: verificationCode,
        token: `verify_${verificationCode}`,
        message: `Your new 6-digit verification code is: ${verificationCode}.`,
      });

      return res.json({
        message: 'A new verification code has been generated and sent to your email inbox.',
        code: verificationCode,
        emailId: email.id,
      });
    } catch (err: any) {
      console.error('Resend verification error:', err);
      return res.status(500).json({ error: 'Failed to resend verification code' });
    }
  },

  // Request password reset
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email address is required' });
      }

      const user = dbService.getUserByEmail(email);
      if (!user) {
        // Return friendly message without leaking account existence
        return res.json({
          message: 'If an account exists with this email, a password reset code has been sent.',
        });
      }

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetExpires = Date.now() + 3600000; // 1 hour

      dbService.updateUser(user.id, { resetCode, resetExpires });

      const resetEmail = dbService.addSimulatedEmail({
        to: user.email,
        type: 'reset_password',
        subject: 'EchoChat Password Reset Code',
        code: resetCode,
        token: `reset_${resetCode}`,
        message: `Hello ${user.displayName}. Use the code ${resetCode} to reset your password. This code expires in 1 hour.`,
      });

      return res.json({
        message: 'A password reset code has been sent to your email inbox.',
        demoHint: {
          code: resetCode,
          emailTo: user.email,
          emailId: resetEmail.id,
        },
      });
    } catch (err: any) {
      console.error('Forgot password error:', err);
      return res.status(500).json({ error: 'Password reset request failed' });
    }
  },

  // Confirm password reset
  async resetPassword(req: Request, res: Response) {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'Email, reset code, and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const user = dbService.getUserByEmail(email);
      if (!user || user.resetCode !== code.trim()) {
        return res.status(400).json({ error: 'Invalid reset code or email address' });
      }

      if (user.resetExpires && user.resetExpires < Date.now()) {
        return res.status(400).json({ error: 'This reset code has expired. Please request a new one.' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      dbService.updateUser(user.id, {
        passwordHash,
        resetCode: undefined,
        resetExpires: undefined,
      });

      return res.json({
        message: 'Password reset successful! You can now log in with your new password.',
      });
    } catch (err: any) {
      console.error('Reset password error:', err);
      return res.status(500).json({ error: 'Failed to reset password' });
    }
  },

  // Get current user
  async getMe(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = dbService.getUserById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      return res.json({ user });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
  },

  // Update profile
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { displayName, about, avatarUrl, privacySettings } = req.body;
      const updates: any = {};
      if (displayName !== undefined) updates.displayName = displayName.trim();
      if (about !== undefined) updates.about = about.trim();
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
      if (privacySettings !== undefined) updates.privacySettings = privacySettings;

      const updated = dbService.updateUser(userId, updates);
      return res.json({ user: updated });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  },
};
