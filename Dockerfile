FROM node:20 AS frontendbuild
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM maven AS grupo1build
WORKDIR /home/ejemplo
COPY backend/pom.xml pom.xml
RUN mvn verify --fail-never
COPY backend/src src
COPY --from=frontendbuild /fe/dist/jyaa-frontend/browser/ src/main/webapp/
RUN mvn clean package -q

FROM tomcat:10-jdk21
COPY --from=grupo1build /home/ejemplo/target/jyaa2026-grupo1.war /usr/local/tomcat/webapps/ROOT.war
