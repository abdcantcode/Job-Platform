import { Router } from 'express';
import {
  changeStatus,
  create,
  getOne,
  list,
  remove,
  sendRemindersNow,
  stats,
  update,
} from '../controllers/application.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/stats', stats);
router.post('/reminders/run', sendRemindersNow);

router.route('/').get(list).post(create);
router.route('/:id').get(getOne).put(update).delete(remove);
router.patch('/:id/status', changeStatus);

export default router;
