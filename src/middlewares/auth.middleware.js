    // middlewares/auth.middleware.js
    import jwt from 'jsonwebtoken';

    export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuarioId = decoded.cve_usuario; // Aquí usas el campo que guardaste en el token
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    }
