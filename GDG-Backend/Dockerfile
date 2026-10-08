FROM node:20-slim

# Install Python 3, pip, and image processing libraries for Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-setuptools \
    libfreetype6-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js production dependencies and Python packages
RUN npm ci --only=production
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt || pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 5000

ENV NODE_ENV=production
ENV PYTHON_BIN=python3

CMD ["node", "--max-old-space-size=384", "src/server.js"]
