import { blockagesAPI, uploadsAPI } from './api.js';

export const createBlockage = (data) => blockagesAPI.create(data);
export const getBlockages = (params) => blockagesAPI.getAll(params);
export const getBlockageById = (id) => blockagesAPI.getById(id);
export const updateBlockage = (id, data) => blockagesAPI.update(id, data);
export const deleteBlockage = (id) => blockagesAPI.remove(id);
export const notifyAuthorities = (id) => blockagesAPI.notify(id);
export const uploadBlockageImage = (file) => uploadsAPI.uploadBlockageImage(file);
