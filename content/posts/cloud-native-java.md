---
title: "Cloud Native Java"
subtitle: "使用Java构建云原生应用"
date: 2018-02-23T18:25:37+08:00
draft: false
tags: ["cloud-native","book"]
categories: "cloud-native"
description: "Cloud Native Java中文版（译者：张若飞、宋净超）原书目录和翻译日志"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20180218066.jpg", desc: "Swan lake in Rongcheng|Feb 18,2018"}]
postmeta: false
nocomment: true
---

这是我翻译的第三本Cloud Native技术书，前两本分别是：

- [Cloud Native Go](https://jimmysong.io/cloud-native-go/)
- [Cloud Native Python](https://jimmysong.io/posts/cloud-native-python/)

至今网上都还没有该书的详细目录，翻译过程中我顺便整理了下该书的详细目录信息，精确到section，以供大家参考：

## 目录

### Part I. Basics

#### 1. The Cloud Native Application 

1.1. Amazon’s Story

1.2. The Promise of a Platform

1.3. The Patterns

1.4. Scalability

1.5. Reliability

1.6. Agility

1.7. Netflix’s Story

​    1.7.1. Microservices

​    1.7.2. Splitting the Monolith

​    1.7.3. Netflix OSS

​    1.7.4. Cloud Native Java

1.8. The Twelve Factors

​    1.8.1. Codebase

​         One codebase tracked in revision control, many deploys

​    1.8.2. Dependencies

​         Explicitly declare and isolate dependencies

​    1.8.3. Config

​         Store config in the environment

​     1.8.4. Backing Services

​         Treat backing services as attached resources

​     1.8.5. Build, Release, Run

​         Strictly separate build and run stages

​     1.8.6. Processes

​         Execute the app as one or more stateless processes

​     1.8.7. Port Bindings

​         Export services via port binding

​     1.8.8. Concurrency

​         Scale out via the process model

​     1.8.9. Disposability

​         Maximize robustness with fast startup and graceful shutdown

​     1.8.10. Dev/Prod Parity

​         Keep development, staging, and production as similar as possible

​     1.8.11. Logs

​         Treat logs as event streams

​     1.8.12. Admin Processes

​         Run admin/management tasks as one-off processes

1.9. Summary

#### 2. Bootcamp: Introducing Spring Boot and Cloud Foundry

2.1. What Is Spring Boot?

2.2. Getting Started with the Spring Initializr

2.3. Getting Started with the Spring Tool Suite

2.3.1. Installing Spring Tool Suite (STS)

2.3.2. Creating a New Project with the Spring Initializr

2.4. The Spring Guides

​    2.4.1. Following the Guides in STS

2.5. Configuration

2.6. Cloud Foundry

2.7. Summary

#### 3. Twelve-Factor Application Style Configuration

3.1. The Confusing Conflation of "Configuration"

3.2. Support in Spring Framework

​    3.2.1. The PropertyPlaceholderConfigurer

​    3.2.2. The Environment Abstraction and @Value

​    3.2.3. Profiles

3.3. Bootiful Configuration

3.4. Centralized, Journaled Configuration with the Spring Cloud Configuration Server

​    3.4.1. The Spring Cloud Config Server

​    3.4.2. Spring Cloud Config Clients

​    3.4.3. Security

3.5. Refreshable Configuration

3.6. Summary

#### 4. Testing

4.1. The Makeup of a Test

4.2. Testing in Spring Boot

4.3. Integration Testing

4.3.1. Test Slices

4.3.2. Mocking in Tests

4.3.3. Working with the Servlet Container in @SpringBootTest

4.3.4. Slices

​    @JsonTest

​    @WebMvcTest

​    @DataJpaTest

​    @RestClientTest

4.4. End-to-End Testing

​    4.4.1. Testing Distributed Systems

​    4.4.2. Consumer-Driven Contract Testing

​    4.4.3. Spring Cloud Contract

4.5. Summary

#### 5. The Forklifted Application

5.1. The Contract

5.2. Migrating Application Environments

​    5.2.1. The Out-of-the-Box Buildpacks

​    5.2.2. Custom(ized) Buildpacks

​    5.2.3. Containerized Applications

5.3. Soft-Touch Refactoring to Get Your Application into the Cloud

​    5.3.1. Talking to Backing Services

​    5.3.2. Achieving Service Parity with Spring

​        Remote Procedure Calls

​        HTTP sessions with Spring Session

​        The Java Message Service

​        Distributed transactions using the X/Open XA Protocol and JTA

​        Cloud filesystems

​        HTTPS

​        Email

​        Identity management

5.4. Summary

### Part II. Web Services

#### 6. REST APIs

6.1. Leonard Richardson’s Maturity Model

6.2. Simple REST APIs with Spring MVC

6.3. Content Negotiation

​    6.3.1. Reading and Writing Binary Data

​    6.3.2. Google Protocol Buffers

6.4. Error Handling

6.5. Hypermedia

6.5.1. Media Type and Schema

6.6. API Versioning

6.7. Documenting REST APIs

6.8. The Client Side

​    6.8.1. REST Clients for Ad Hoc Exploration and Interaction

​    6.8.2. The RestTemplate

6.9. Summary

#### 7. Routing

7.1. The DiscoveryClient Abstraction

7.2. Cloud Foundry Route Services

7.3. Summary

#### 8. Edge Services

8.1. The Greetings Service

8.2. A Simple Edge Service

8.3. Netflix Feign

8.4. Filtering and Proxying with Netflix Zuul

​    8.4.1. A Custom Zuul Filter

​    8.5. Security on the Edge

8.6. OAuth

​    8.6.1. Service-Side Applications

​    8.6.2. HTML5 and JavaScript Single-Page Applications

​    8.6.3. Applications Without Users

​    8.6.4. Trusted Clients

8.7. Spring Security

8.8. Spring Cloud Security

​    8.8.1. A Spring Security OAuth Authorization Server

​    8.8.2. Securing the Greetings Resource Server

​    8.8.3. Build an OAuth-Secured Single-Page Application

​    8.8.4. Summary

### Part III. Data Integration

#### 9. Managing Data

9.1. Modeling Data

​    9.1.1. Relational Database Management Systems (RDBMS)

​    9.1.2. NoSQL

9.2. Spring Data

​    9.2.1. Structure of a Spring Data Application

​    9.2.2. Domain Class

​    9.2.3. Repositories

​    9.2.4. Organizing Java Packages for Domain Data

​        Supported repositories

9.3. Getting Started with RDBMS Data Access on JDBC

9.4. Spring’s JDBC Support

9.5. Spring Data Examples

9.6. Spring Data JPA

​    9.6.1. Account Service

​        Using profiles for different data sources

​        Describing the Account Service’s domain with JPA

​        Auditing with JPA

​    9.6.2. Integration Tests

9.7. Spring Data MongoDB

​    9.7.1. Order Service

​        Document classes with MongoDB

​        Auditing with MongoDB

​    9.7.2. Integration Tests

9.8. Spring Data Neo4j

​    9.8.1. Inventory Service

​        Configuring Neo4j

​        Graph data modeling with Neo4j

​    9.8.2. Integration Tests

9.9. Spring Data Redis

​    9.9.1. Caching

9.10. Summary

#### 10. Messaging

10.1. Event-Driven Architectures with Spring Integration

​    10.1.1. Messaging Endpoints

​    10.1.2. From Simple Components, Complex Systems

10.2. Message Brokers, Bridges, the Competing Consumer Pattern, and Event Sourcing

​    10.2.1. Publish-Subscribe Destination

​    10.2.2. Point-to-Point Destination

10.3. Spring Cloud Stream

​    10.3.1. A Stream Producer

​    10.3.2. A Stream Consumer

10.4. Summary

#### 11. Batch Processes and Tasks

11.1. Batch Workloads

11.2. Spring Batch

​    11.2.1. Our First Batch Job

11.3. Scheduling

11.4. Remote Partitioning a Spring Batch Job with Messaging

11.5. Task Management

11.6. Process-Centric Integration with Workflow

11.7. Distribution with Messaging

11.8. Summary

#### 12. Data Integration

12.1. Distributed Transactions

12.2. Isolating Failures and Graceful Degradation

12.3. The Saga Pattern

12.4. CQRS (Command Query Responsibility Segregation)

​    12.4.1. The Complaints API

​    12.4.2. The Complaint Statistics API

12.5. Spring Cloud Data Flow

​    12.5.1. Streams

​    12.5.2. Tasks

​    12.5.3. The REST API

​    12.5.4. Meet the Data Flow Clients

​        The Dashboard

​        The Spring Cloud Data Flow shell

​        The DataFlowTemplate

12.6. Summary

### IV. Production

#### 13. The Observable System

13.1. You Build It, You Run It

13.2. Murder Mystery Microservices

13.3. Twelve-Factor Operations

13.4. The New Deal

13.5. Observability

13.6. Push Versus Pull Observability and Resolution

13.7. Capturing an Application’s Present Status with Spring Boot Actuator

13.8. Metrics

​    Joined-up views of metrics

​    Metric data dimensions

​    Shipping metrics from a Spring Boot application

13.9. Identifying Your Service with the /info Endpoint

13.10. Health Checks

13.11. Audit Events

13.12. Application Logging

​    13.12.1. Specifying Log Output

​    13.12.2. Specifying Log Levels

13.13. Distributed Tracing

​    13.13.1. Finding Clues with Spring Cloud Sleuth

​    13.13.2. How Much Data Is Enough?

​    13.13.3. OpenZipkin: A Picture Is Worth a Thousand Traces

​    13.13.4. Tracing Other Platforms and Technologies

13.14. Dashboards

​    13.14.1. Monitoring Downstream Services with the Hystrix Dashboard

​    13.14.2. Codecentric’s Spring Boot Admin

​    13.14.3. Ordina Microservices Dashboard

​    13.14.4. Pivotal Cloud Foundry’s AppsManager

13.15. Remediation

13.16. Summary

#### 14. Service Brokers

14.1. The Life of a Backing Service

14.2. The View from the Platform

14.3. Implementing a Service Broker with Spring Cloud Cloud Foundry Service Broker

​    14.3.1. A Simple Amazon S3 Service Broker

​    14.3.2. The Service Catalog

​    14.3.3. Managing Service Instances

​    14.3.4. Service Bindings

​    14.3.5. Securing the Service Broker

14.4. Deployment

​    14.4.1. Releasing with BOSH

​    14.4.2. Releasing with Cloud Foundry

14.5. Registering the Amazon S3 Service Broker

14.6. Creating Amazon S3 Service Instances

​    14.6.1. Consuming Service Instances

14.7. An S3 Client Application

14.8. Seeing It All Come Together

14.9. Summary

#### 15. Continuous Delivery

15.1. Beyond Continuous Integration

​    15.1.1. John Allspaw at Flickr and then Etsy

​    15.1.2. Adrian Cockroft at Netflix

​    15.1.3. Continuous Delivery at Amazon

15.2. The Pipeline

15.3. Testing

15.4. Continuous Delivery for Microservices

15.5. Tools

15.6. Concourse

​    15.6.1. Containers

15.7. Continuously Delivering Microservices

​    15.7.1. Installing Concourse

​    15.7.2. Basic Pipeline Design

​    15.7.3. Continuous Integration

15.8. Consumer-Driven Contract Testing

​    15.8.1. User Microservice Pipeline

15.9. Data

15.10. To Production!

#### Part V. Appendix A

A. Using Spring Boot with Java EE

​    A.1. Compatibility and Stability

​    A.2. Dependency Injection with JSR 330 (and JSR 250)

​    A.3. Using Servlet APIs in a Spring Boot Application

​    A.4. Building REST APIs with JAX-RS (Jersey)

​    A.5. JTA and XA Transaction Management

​        A.5.1. Resource-Local Transactions with Spring’s PlatformTransactionManager

​        A.5.2. Global Transactions with the Java Transaction API (JTA)

​    A.6. Deployment in a Java EE Environment

​    A.7. Summary

---

## 翻译进度日志

我负责本书的第九章到最后的翻译，翻译进度记录：

- 2018-02-04，完成了第9章的翻译
- 2018-02-20，完成了第10章的翻译
- 2018-03-10，完成了第11章的翻译
- 2018-04-06，完成了第12章的翻译
- 2018-04-15，完成了第13章的翻译
- 2018-04-22，完成了第14章的翻译
- 2018-04-29，完成了第15章的翻译
- 2018-05-02，完成了附录的翻译

至此全书翻译完成。