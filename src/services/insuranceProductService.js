const insuranceProducts = require("../data/insuranceProducts");

const escapeRegExp = (value = "") =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizePagination = ({ page, limit }) => {
    const normalizedPage = Math.max(1, parseInt(page, 10) || 1);
    const normalizedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 6));

    return {
        page: normalizedPage,
        limit: normalizedLimit,
        skip: (normalizedPage - 1) * normalizedLimit,
    };
};

const matchesSearch = (product, q) => {
    if (!q) return true;

    const regex = new RegExp(escapeRegExp(q), "i");
    const searchableFields = [
        product.title,
        product.description,
        product.badge,
        product.label,
        product.infoPath,
        ...(Array.isArray(product.features) ? product.features : []),
    ].filter(Boolean);

    return searchableFields.some((value) => regex.test(value));
};

const listInsuranceProducts = ({ q = "", page = 1, limit = 6 } = {}) => {
    const query = String(q || "").trim();
    const { page: normalizedPage, limit: normalizedLimit, skip } = normalizePagination({
        page,
        limit,
    });

    const filteredProducts = insuranceProducts.filter(
        (product) => product.isActive && matchesSearch(product, query)
    );

    const paginatedProducts = filteredProducts.slice(skip, skip + normalizedLimit);

    return {
        products: paginatedProducts,
        meta: {
            total: filteredProducts.length,
            page: normalizedPage,
            limit: normalizedLimit,
        },
    };
};

module.exports = {
    listInsuranceProducts,
};