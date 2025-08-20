const express = require('express');
const router = express.Router();
const Otp = require('../models/Otp');
const nodemailer = require('nodemailer');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate 4-digit OTP
const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    console.log("Incoming request body:", req.body);
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const otpCode = generateOtp();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email },
      { otp: otpCode, expiresAt: expiry, verified: false },
      { upsert: true, new: true }
    );

    const mailResponse = await transporter.sendMail({
      from: `"OTP Verification" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otpCode}. It will expire in 5 minutes.`
    });

    console.log("Mail sent response:", mailResponse);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error("Error in /send-otp:", error);
    res.status(500).json({ error: error.message });
  }
});


// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const record = await Otp.findOne({ email });
    if (!record) return res.status(400).json({ error: 'No OTP found for this email' });

    // Already used
    if (record.verified) {
      return res.status(400).json({ error: 'OTP already used' });
    }

    // Check expiry
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Match OTP
    if (record.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Mark as verified and remove OTP immediately
    await Otp.deleteOne({ email });

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
