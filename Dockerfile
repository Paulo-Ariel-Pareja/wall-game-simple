# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar aplicación
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar build desde stage anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Exponer puerto
EXPOSE 3000

# Usuario no privilegiado
USER node

# Comando de inicio
CMD ["node", "dist/main"]
