const express = require('express');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 2MB
});

module.exports = function createMediaRoutes({ controller, auth, requireUser, requireAdmin }) {
    const router = express.Router();

    router.post(
        "/avatar",
        auth,
        requireUser,
        (req, res, next) => {
            upload.single("file")(req, res, (err) => {
                if (err?.code === "LIMIT_FILE_SIZE") {
                    return res.status(413).json({ error: "File too large" });
                }
                if (err) return next(err);
                next();
            });
        },
        controller.uploadAvatarHandler
    );

    router.get("/avatar", auth, requireUser, controller.getMyAvatarHandler);
    router.get("/users/:uid/avatar", controller.getUserAvatarHandler);
    router.delete("/avatar", auth, requireUser, controller.deleteAvatarHandler);

    /**
 * @swagger
 * tags:
 *   name: Media
 *   description: User avatars
 */

    /**
     * @swagger
     * /api/media/avatar:
     *   post:
     *     summary: Upload or replace current user's avatar
     *     tags: [Media]
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *     responses:
     *       201: { description: Avatar uploaded }
     */


    /**
     * @swagger
     * /api/media/avatar:
     *   get:
     *     summary: Get current user's avatar
     *     tags: [Media]
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200: { description: Avatar image }
     */

    /**
     * @swagger
     * /api/media/users/{uid}/avatar:
     *   get:
     *     summary: Get another user's avatar (public)
     *     tags: [Media]
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema: { type: integer }
     *     responses:
     *       200: { description: Avatar image }
     */

    /**
     * @swagger
     * /api/media/avatar:
     *   delete:
     *     summary: Delete current user's avatar
     *     tags: [Media]
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       204: { description: Deleted }
     */

    return router;
};
