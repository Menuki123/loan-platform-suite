const { evaluateCustomerEligibility } = require("../services/underwritingService");

exports.checkEligibility = async (req, res) => {
    try {
        const { customer_id, product_type } = req.body;

        if (!customer_id || !product_type) {
            return res.status(400).json({
                status: "error",
                message: "customer_id and product_type are required"
            });
        }

        const result = await evaluateCustomerEligibility(customer_id, product_type);

        if (!result) {
            return res.status(404).json({ status: "error", message: "Customer not found" });
        }

        return res.json({ status: "success", ...result });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
};
