FROM maven AS grupo1build
WORKDIR /home/ejemplo
COPY backend/pom.xml pom.xml
RUN mvn verify --fail-never
COPY backend/src src
RUN mvn package

FROM tomcat:10-jdk21
COPY --from=grupo1build /home/ejemplo/target/jyaa2026-grupo1.war /usr/local/tomcat/webapps/ROOT.war
