import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';
import { validateLogin, validateRegister } from '../utils/validators.js';

export const register = asyncHandler(async (req, res) => {
  const data = validateRegister(req.body);

  if (await User.exists({ email: data.email })) {
    throw new ApiError(409, 'An account with this email already exists.', {
      email: 'This email is already registered.',
    });
  }

  const user = await User.create(data);
  res.status(201).json({ token: signToken(user.id), user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = validateLogin(req.body);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password.');
  }

  res.json({ token: signToken(user.id), user });
});

export const me = (req, res) => {
  res.json({ user: req.user });
};
