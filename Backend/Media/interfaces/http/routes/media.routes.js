const express = require('express');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

module.exports = function createMediaRoutes({ controller, auth }) {
    const router = express.Router();

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
    router.post(
        '/avatar',
        auth,
        upload.single('file'),
        controller.uploadAvatarHandler
    );

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
    router.get('/avatar', auth, controller.getMyAvatarHandler);

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
    router.get('/users/:uid/avatar', controller.getUserAvatarHandler);

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
    router.delete('/avatar', auth, controller.deleteAvatarHandler);

    return router;
};
