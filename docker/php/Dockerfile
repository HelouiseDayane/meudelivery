FROM php:8.3-fpm-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    build-base \
    freetype-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    libzip-dev \
    zip \
    jpegoptim optipng pngquant gifsicle \
    unzip \
    curl \
    oniguruma-dev \
    supervisor \
    nginx \
    mysql-client \
    redis \
    git

# Configurar e instalar extensões PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg
RUN docker-php-ext-install \
    pdo_mysql \
    mbstring \
    zip \
    exif \
    pcntl \
    gd \
    opcache \
    bcmath

# Instalar Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Instalar APCu para cache adicional
RUN pecl install apcu && docker-php-ext-enable apcu

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurar diretório de trabalho
WORKDIR /var/www/html

# Copiar arquivos de configuração do PHP
COPY php.ini /usr/local/etc/php/conf.d/99-custom.ini
COPY php-fpm.conf /usr/local/etc/php-fpm.d/www.conf

# Configurar permissões
RUN addgroup -g 1000 -S www && \
    adduser -u 1000 -S www -G www

# Configurar Supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Script de inicialização
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expor porta
EXPOSE 9000

# Usuário não-root
USER www

# Comando de entrada
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]