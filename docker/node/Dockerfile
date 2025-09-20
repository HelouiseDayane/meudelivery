FROM node:20-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Configurar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Configurar diretório de trabalho
WORKDIR /usr/src/app

# Configurar npm para melhor performance
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fund false && \
    npm config set audit false

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production --silent

# Copiar script de inicialização
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Configurar permissões
RUN chown -R nextjs:nodejs /usr/src/app
USER nextjs

# Expor porta
EXPOSE 3000

# Comando de entrada
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npm", "run", "dev"]