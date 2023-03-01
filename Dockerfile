FROM node:16.5-alpine

COPY . /app
WORKDIR /app
RUN npm install --only=production
EXPOSE 3030
CMD ["npm","start"]
