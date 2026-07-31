const { z } = require('zod');

const passwordStrength = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;
const passwordSchema = z.string().regex(passwordStrength, 'Password must be 8-128 characters and include an uppercase letter, number, and special character.');

const registerSchema = z.object({
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(50),
  role: z.enum(['admin', 'analyst', 'viewer']).default('analyst')
});
const loginSchema = z.object({
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128)
});
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1).max(128)
}).refine((value) => value.newPassword === value.confirmNewPassword, { path: ['confirmNewPassword'], message: 'New password confirmation does not match.' });
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().trim().min(1).max(64).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({ ...req.query, ...req.body });
      req.validated = parsed;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { passwordStrength, passwordSchema, registerSchema, loginSchema, changePasswordSchema, paginationSchema, validate };
