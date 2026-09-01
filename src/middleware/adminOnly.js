// middleware para asegurar que el usuario autenticado tiene role === 'admin'
module.exports = function adminOnly(req, res, next) {
    try {
        const user = req.user;
        if (!user)
            return res
                .status(401)
                .json({ success: false, message: "Autenticación requerida" });
        if (user.role !== "admin")
            return res
                .status(403)
                .json({
                    success: false,
                    message: "Acceso denegado (solo administradores)",
                });
        return next();
    } catch (err) {
        return res
            .status(500)
            .json({ success: false, message: "Error de autorización" });
    }
};
