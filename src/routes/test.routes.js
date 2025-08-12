import express from 'express';
import { getServerTime } from '../controller/test.controller.js';

const router = express.Router();

router.get('/', getServerTime);

export default router;
