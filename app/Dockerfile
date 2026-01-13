
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
copy .env .env.local

RUN npm install 

COPY . .

EXPOSE 3000  

CMD ["npm", "start"]
