# ================================
# Dockerfile para MediCitas Backend
# ================================

# Usar Node.js LTS (Long Term Support) como base
FROM node:20-alpine AS base

# Instalar dependencias del sistema necesarias para algunas librerías nativas
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Crear directorio de la aplicación
WORKDIR /usr/src/app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# ================================
# STAGE 1: Dependencies
# ================================
FROM base AS dependencies

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# ================================
# STAGE 2: Production Build
# ================================
FROM base AS production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S medicitas -u 1001

# Copiar dependencias de producción
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# Copiar código fuente
COPY --chown=medicitas:nodejs . .

# Crear directorios necesarios para la aplicación
RUN mkdir -p /usr/src/app/uploads /usr/src/app/temp && \
    chown -R medicitas:nodejs /usr/src/app/uploads /usr/src/app/temp

# Cambiar a usuario no-root
USER medicitas

# Exponer puerto de la aplicación
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck para verificar que la aplicación esté funcionando
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Comando para iniciar la aplicación
CMD ["node", "src/server.js"]
