import { Router } from "express";
import { getAll, getOne, create, update, remove } from "../controllers/users.controller.js";

const router = Router();

router.get("/", getAll);
router.get("/:userId", getOne);
router.post("/", create);
router.put("/:userId", update);
router.delete("/:userId", remove);

export default router;
