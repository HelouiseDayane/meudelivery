FROM node:20

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

#WORKDIR /app
#COPY . .
#RUN cat .env
#RUN npm install


EXPOSE 3000

CMD ["npm", "run", "preview"]
#CMD ["npm", "run", "dev", "--", "--host"]