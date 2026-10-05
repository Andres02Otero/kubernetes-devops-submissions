# Node 22 y no 20 como las demas apps: @kubernetes/client-node 2.x usa
# undici, que necesita APIs que Node 20 no tiene (falla al arrancar).
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY src ./src

CMD ["node", "src/index.js"]
