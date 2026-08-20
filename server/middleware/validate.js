import { validationResult, body, param, query } from 'express-validator';

export function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed.',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  body('remember').optional().isBoolean(),
  handleValidation,
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword').notEmpty().withMessage('New password is required.'),
  handleValidation,
];

export const idParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid ID is required.'),
  handleValidation,
];

export const slugParamValidation = [
  param('slug').trim().notEmpty().withMessage('Valid slug is required.'),
  handleValidation,
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  handleValidation,
];

export function requiredString(field, label = field) {
  return body(field).trim().notEmpty().withMessage(`${label} is required.`);
}

export function optionalString(field) {
  return body(field).optional({ nullable: true }).trim();
}

export function optionalBool(field) {
  return body(field).optional().isBoolean().withMessage(`${field} must be a boolean.`);
}

export function optionalUrl(field) {
  return body(field)
    .optional({ nullable: true })
    .trim()
    .custom((value) => {
      if (!value || value === '#') return true;
      try {
        const parsed = new URL(value);
        if (parsed.protocol !== 'https:') {
          throw new Error('URL must use HTTPS.');
        }
        return true;
      } catch {
        throw new Error('Invalid URL format.');
      }
    });
}

export function optionalJsonArray(field) {
  return body(field)
    .optional()
    .custom((value) => {
      if (value == null) return true;
      if (Array.isArray(value)) return true;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed);
        } catch {
          throw new Error(`${field} must be a valid JSON array.`);
        }
      }
      throw new Error(`${field} must be an array.`);
    });
}
