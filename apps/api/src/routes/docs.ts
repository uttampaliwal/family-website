import express from "express";
import swaggerUi from "swagger-ui-express";
import specs from "../config/swagger.js";
import { isProduction } from "../config/environment.js";

const router = express.Router();

// Swagger UI setup options
const swaggerOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2563eb }
  `,
  customSiteTitle: "Family Portal API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    docExpansion: "none",
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: !isProduction(), // Disable try-it-out in production
  },
};

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: API Documentation
 *     description: Interactive API documentation using Swagger UI
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: API documentation page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(specs, swaggerOptions));

/**
 * @swagger
 * /api/docs/json:
 *   get:
 *     summary: OpenAPI JSON Specification
 *     description: Raw OpenAPI specification in JSON format
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get("/json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

export default router;
