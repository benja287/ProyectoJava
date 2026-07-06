FROM node:20 AS frontendbuild
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM maven AS grupo1build
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /home/ejemplo
COPY backend/pom.xml pom.xml
RUN mvn verify --fail-never
COPY backend/src src
COPY --from=frontendbuild /fe/dist/jyaa-frontend/browser/ src/main/webapp/
RUN mvn clean package -q
RUN WAR=target/jyaa2026-grupo1.war \
    && unzip -l "$WAR" | grep -q 'main-.*\.js' \
    && unzip -p "$WAR" index.html | grep -q 'app-root' \
    && STYLES=$(unzip -l "$WAR" | awk '/styles-.*\.css/{print $4; exit}') \
    && unzip -p "$WAR" "$STYLES" | grep -q 'panel-hero--admin' \
    && echo "OK WAR verificado (panel admin nuevo)" \
    && unzip -l "$WAR" | grep -E 'main-|version.json' \
    && unzip -p "$WAR" version.json

FROM tomcat:10-jdk21
COPY --from=grupo1build /home/ejemplo/target/jyaa2026-grupo1.war /usr/local/tomcat/webapps/ROOT.war
