import { authService } from '../services/authService.js';
import { sendData } from '../utils/response.js';

export async function register(req, res) {
  const session = await authService.register(req.body);
  sendData(res, session, 201);
}

export async function login(req, res) {
  const session = await authService.login(req.body);
  sendData(res, session, 200);
}

export async function me(req, res) {
  const user = await authService.getCurrentUser(req.user.userId);
  sendData(res, { user });
}
