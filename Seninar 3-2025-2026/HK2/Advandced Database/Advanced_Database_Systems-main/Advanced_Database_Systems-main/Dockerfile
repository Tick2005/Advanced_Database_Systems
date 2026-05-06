FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY backend/pom.xml backend/pom.xml
WORKDIR /app/backend
RUN mvn -q -DskipTests dependency:go-offline

COPY backend/src backend/src
RUN mvn -DskipTests -Dmaven.test.skip=true clean package

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/backend/target/hotel-backend-*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]