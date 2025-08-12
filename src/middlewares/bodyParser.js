const express = require('express');

/**
 * Middleware para parsear el body de las peticiones
 */
const bodyParserMiddleware = [
    // Parsear JSON con límite de tamaño
    express.json({ 
        limit: '10mb',
        strict: true,
        type: 'application/json'
    }),
    
    // Parsear URL encoded data (form data)
    express.urlencoded({ 
        extended: true, 
        limit: '10mb',
        type: 'application/x-www-form-urlencoded'
    }),
    
    // Middleware para debug del body (solo en desarrollo)
    (req, res, next) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Body Parser Debug:', {
                method: req.method,
                url: req.url,
                contentType: req.headers['content-type'],
                bodyType: typeof req.body,
                bodyKeys: req.body ? Object.keys(req.body) : [],
                body: req.body
            });
        }
        next();
    }
];

module.exports = bodyParserMiddleware;