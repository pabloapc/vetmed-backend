const { listInsuranceProducts } = require("../services/insuranceProductService");

exports.listProducts = async (req, res, next) => {
    try {
        const result = listInsuranceProducts({
            q: req.query.q,
            page: req.query.page,
            limit: req.query.limit,
        });

        return res.json(result);
    } catch (error) {
        next(error);
    }
};