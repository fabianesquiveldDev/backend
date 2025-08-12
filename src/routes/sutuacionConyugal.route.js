import { Router } from "express";
const situacionConyugalRoute = Router();
import { SituacionConyugalController } from "../controller/sutuacionConyugal.controller.js";


situacionConyugalRoute.get('/', SituacionConyugalController.getAll);                                               



export { situacionConyugalRoute }; 