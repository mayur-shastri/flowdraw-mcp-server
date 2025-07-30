import {Router} from 'express';
import DiagramController from '../controllers/diagram.controller';

const router = Router();

router.post('/generate', DiagramController.generateDiagram);

export default router;