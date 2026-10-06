FROM node:26-trixie-slim


# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Clone your repo (replace with your repo URL)
RUN git clone --depth=1 https://github.com/richardwa/music-stream.git . && echo 6

RUN npm install

RUN git pull && npm run build && echo 2

CMD ["npm", "start"]
# CMD ["tail","-f", "/dev/null"]

