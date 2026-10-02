import { presentProfile, profileService } from '../services/profileService.js';
import { sendData } from '../utils/response.js';

export async function getProfile(req, res) {
  const profile = await profileService.get(req.user.userId);
  sendData(res, { profile: presentProfile(profile) });
}

export async function updateProfile(req, res) {
  const profile = await profileService.update(req.user.userId, req.body);
  sendData(res, { profile: presentProfile(profile) });
}
