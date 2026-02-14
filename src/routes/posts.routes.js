import { Router } from "express";
import { getAll, getOne, getFull, create, update, remove } from "../controllers/posts.controller.js";

const router = Router();

router.get("/", getAll);
router.get("/:postId", getOne);
router.get("/:postId/full", getFull);

router.post("/", create);
router.put("/:postId", update);
router.delete("/:postId", remove);

export default router;
