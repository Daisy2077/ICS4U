import { Router } from "express";
import { getAll, getOne, create, update, remove } from "../controllers/comments.controller.js";

const router = Router();

router.get("/", getAll);
router.get("/:commentId", getOne);
router.post("/", create);
router.put("/:commentId", update);
router.delete("/:commentId", remove);

export default router;
