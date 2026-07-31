const express = require('express');
const { body } = require('express-validator');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/authController');
const { passwordStrength } = require('../utils/validators');

const router = express.Router();
const emailValidation = body('email').isString().trim().isEmail().isLength({ max: 255 }).normalizeEmail();
const passwordValidation = body('password').isString().matches(passwordStrength).withMessage('Password must be 8-128 characters and include an uppercase letter, number, and special character.').isLength({ max: 128 });

router.use(authLimiter);
router.post('/register', [emailValidation, passwordValidation, body('fullName').isString().trim().isLength({ min: 2, max: 50 }), body('role').optional().isIn(['admin', 'analyst', 'viewer'])], controller.register);
router.post('/login', [emailValidation, body('password').isString().isLength({ min: 1, max: 128 })], controller.login);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.getMe);
router.post('/refresh', authenticate, controller.refreshToken);
router.put('/password', authenticate, [body('currentPassword').isString().isLength({ min: 1, max: 128 }), body('newPassword').isString().matches(passwordStrength).withMessage('New password must meet password strength requirements.').isLength({ max: 128 }), body('confirmNewPassword').isString().custom((value, { req }) => value === req.body.newPassword).withMessage('New password confirmation does not match.')], controller.changePassword);
router.put('/profile', authenticate, [body('fullName').isString().trim().isLength({ min: 2, max: 50 })], controller.updateProfile);

module.exports = router;
