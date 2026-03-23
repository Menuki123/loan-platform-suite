const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    const start = Date.now();
    console.log("=================================");
    console.log(`[API] ${req.method} ${req.originalUrl}`);
    console.log("[API] Body:", req.body);

    res.on("finish", () => {
        console.log(`[API] Completed ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${Date.now() - start}ms`);
        console.log("=================================");
    });

    next();
});

const swaggerDocument = YAML.load("./openapi.yaml");

const customerRoutes = require("./routes/customers");
const loanRoutes = require("./routes/loans");
const paymentRoutes = require("./routes/payments");
const reportRoutes = require("./routes/reports");
const underwritingRoutes = require("./routes/underwriting");
const userRoutes = require("./routes/users");
const groupRoutes = require("./routes/groups");
const applicationFormRoutes = require("./routes/applicationForms");

app.use("/customers", customerRoutes);
app.use("/loans", loanRoutes);
app.use("/payments", paymentRoutes);
app.use("/reports", reportRoutes);
app.use("/underwriting", underwritingRoutes);
app.use("/users", userRoutes);
app.use("/groups", groupRoutes);
app.use("/application-forms", applicationFormRoutes);


app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "api-server" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
