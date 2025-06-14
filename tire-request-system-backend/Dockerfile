# Stage 1: Build the application
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Create the runtime image
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/tire-request-system-0.0.1-SNAPSHOT.jar app.jar

# Expose port and define entry point
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

# Optional: Add a volume for uploads if it's not handled externally in docker-compose
# VOLUME /app/uploads
