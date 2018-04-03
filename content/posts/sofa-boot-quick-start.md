---
title: "金融级开源分布式中间件 SOFA Boot 快速开始"
subtitle: "基于 Spring Boot"
date: 2018-04-03T18:14:59+08:00
draft: false
tags: ["sofa","microservices","middleware"]
categories: "microservices"
description: "在微服务开发中，Java 一直都是一门被广泛使用的语言，而 Java 的微服务框架如 Spring Boot 和 Spring Cloud 也具有广泛的受众，在蚂蚁金服内部长期的生产实践中创建了一套名为 SOFA（Scalable Open Financial Architecture），本文讲解如何使用 SOFA Boot 快速开发分布式 Web 应用程序。"
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/2018032801.jpg", desc: "Shanghai Center Building@Shanghai|Mar 28,2018"}]
---

在微服务开发中，Java 一直都是一门被广泛使用的语言，而 Java 的微服务框架如 Spring Boot 和 Spring Cloud 也具有广泛的受众，在蚂蚁金服内部长期的生产实践中创建了一套名为 SOFA（Scalable Open Financial Architecture），本文讲解如何使用 SOFA Boot 快速开发分布式 Web 应用程序。

> SOFA Boot 是蚂蚁金服即将开源的一套微服务框架中的一个组件，开源地址：https://github.com/alipay/sofa-boot

关于 Spring Boot 请参考 [Spring Boot 快速开始指南](https://jimmysong.io/posts/spring-boot-quick-start-guide)。

## SOFA boot 简介

SOFA Boot 是蚂蚁金服基于 `SpringBoot` 的中间件轻量集成方案，与标准的 `SpringBoot` 工程无缝集成，提供了易用、统一的编程界面，具备以下特性：

- 基于微服务框架`SpringBoot`，与 `SpringBoot` 和 `Spring` 框架无缝集成；
- 集成蚂蚁金服中间件，包括 SOFA REST、SOFA RPC、DMS（分布式消息服务）、DDS（分布式数据源服务） 等，提供统一编程界面；
- 集成日志埋点工具 Tracer ，提供中间件统一日志埋点和上下文 ID；
- 作为 `SpringBoot` 上蚂蚁中间件的功能扩展，支持 `FAT JAR`包部署，支持的 `Servlet` 容器有 `Tomcat`、`Jetty` 和 `Undertow`；

## 准备环境

开发 SOFA boot 应用需要准备如下环境。

- Java 7 或 Java 8
- Maven 3.2.5

### 配置 Maven

修改 maven 配置 `~/.m2/setttings.xml`。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
	 <offline>false</offline>
  <pluginGroups>
  <servers>
    <server>
      <id>xxx@xxx</id>
      <username>xxx</username>
      <password>xxx</password>
    </server>
  </servers>
  <mirrors>
  </mirrors>
  <profiles>
	<profile>
	<id>dev</id>
	<activation>
		<activeByDefault>true</activeByDefault>
	</activation>
	<repositories>
		<repository>
			<id>central_prod</id>
			<url>http://xxx/artifactory/repo</url>
			<snapshots>
				<enabled>true</enabled>
			</snapshots>
		</repository>
		<repository>
			<id>central</id>
			<url>http://xxx/artifactory/repo</url>
			<snapshots>
				<enabled>true</enabled>
			</snapshots>
		</repository>
		<repository>
			<id>snapshots</id>
			<url>http://xxx/artifactory/repo</url>
			<releases>
				<enabled>true</enabled>
			</releases>
		</repository>
	</repositories>
	<pluginRepositories>
		<pluginRepository>
			<id>central</id>
			<url>http://xxx/artifactory/repo</url>
			<snapshots>
				<enabled>false</enabled>
			</snapshots>
		</pluginRepository>

	</pluginRepositories>
    </profile>
  </profiles>
</settings>
```

注意修改其中 `server` 标签下的配置，`id`、`username` 和 `password` 还有各种库的地址。

## 创建工程

SOFA Boot 支持创建 Web 工程和 core 工程。

使用下面的命令创建一个 Web 工程。

```bash
mvn archetype:generate -DarchetypeRepository=http://mvn.dev.alipay.net/artifactory/content/repositories/Alipay-Snapshot/ -DarchetypeGroupId=com.alipay.sofa -DarchetypeArtifactId=sofaboot-alipay-web-archetype -DarchetypeVersion=1.0-SNAPSHOT -DarchetypeCatalog=internal
```

运行该命令会提示输入 `groupId`、`artifactId` 、 `version` 和 `package`。

```bash
[INFO] Scanning for projects...
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] Building Maven Stub Project (No POM) 1
[INFO] ------------------------------------------------------------------------
[INFO]
[INFO] >>> maven-archetype-plugin:3.0.1:generate (default-cli) > generate-sources @ standalone-pom >>>
[INFO]
[INFO] <<< maven-archetype-plugin:3.0.1:generate (default-cli) < generate-sources @ standalone-pom <<<
[INFO]
[INFO]
[INFO] --- maven-archetype-plugin:3.0.1:generate (default-cli) @ standalone-pom ---
[INFO] Generating project in Interactive mode
[WARNING] Archetype not found in any catalog. Falling back to central repository.
[WARNING] Add a repsoitory with id 'archetype' in your settings.xml if archetype's repository is elsewhere.
Define value for property 'groupId': io.jimmysong.sofa
Define value for property 'artifactId': sofa-demo
Define value for property 'version' 1.0-SNAPSHOT: :
Define value for property 'package' io.jimmysong.sofa: :
Confirm properties configuration:
groupId: io.jimmysong.sofa
artifactId: sofa-demo
version: 1.0-SNAPSHOT
package: io.jimmysong.sofa
 Y: :
[INFO] ----------------------------------------------------------------------------
[INFO] Using following parameters for creating project from Archetype: sofaboot-alipay-web-archetype:1.0-SNAPSHOT
[INFO] ----------------------------------------------------------------------------
[INFO] Parameter: groupId, Value: io.jimmysong.sofa
[INFO] Parameter: artifactId, Value: sofa-demo
[INFO] Parameter: version, Value: 1.0-SNAPSHOT
[INFO] Parameter: package, Value: io.jimmysong.sofa
[INFO] Parameter: packageInPathFormat, Value: io/jimmysong/sofa
[INFO] Parameter: package, Value: io.jimmysong.sofa
[INFO] Parameter: version, Value: 1.0-SNAPSHOT
[INFO] Parameter: groupId, Value: io.jimmysong.sofa
[INFO] Parameter: artifactId, Value: sofa-demo
[INFO] Parent element not overwritten in /Users/jimmysong/Workspace/SOFA/sofa-demo/app/endpoint/pom.xml
[INFO] Parent element not overwritten in /Users/jimmysong/Workspace/SOFA/sofa-demo/app/web/pom.xml
[INFO] Project created from Archetype in dir: /Users/jimmysong/Workspace/SOFA/sofa-demo
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 14.837 s
[INFO] Finished at: 2018-04-02T15:48:56+08:00
[INFO] Final Memory: 16M/309M
[INFO] ------------------------------------------------------------------------
```

- `groupId`：组织名称，一般使用域名的倒叙，作为包名
- `artifactId`：项目名称，会在当前目录下创建该名字的目录

项目代码生成完毕后将在运行该命令的运行路径下生成一个这样的项目结构（这是一个 Web 项目，所以项目中有个 `web` 目录）：

```bash
sofa-demo
├── app
│   ├── endpoint
│   │   ├── pom.xml
│   │   └── src
│   │       └── main
│   │           ├── java
│   │           │   └── io
│   │           │       └── jimmysong
│   │           │           └── sofa
│   │           │               └── endpoint # SOFA REST 实现代码
│   │           │                   ├── constants
│   │           │                   │   ├── RestConstants.java
│   │           │                   │   └── URLConstants.java
│   │           │                   ├── exception
│   │           │                   │   ├── CommonException.java
│   │           │                   │   └── SofaRestExceptionHandler.java
│   │           │                   ├── facade
│   │           │                   │   ├── FaviconRestFacade.java
│   │           │                   │   └── SampleRestFacade.java
│   │           │                   ├── filter
│   │           │                   │   └── CommonContainerResponseFilter.java
│   │           │                   ├── impl
│   │           │                   │   ├── FaviconRestFacadeRestImpl.java
│   │           │                   │   └── SampleRestFacadeRestImpl.java
│   │           │                   ├── model
│   │           │                   │   └── DemoUserModel.java
│   │           │                   └── response
│   │           │                       ├── AbstractFacadeResp.java
│   │           │                       └── RestSampleFacadeResp.java
│   │           └── resources
│   │               └── META-INF
│   │                   └── sofa-demo
│   │                       └── sofa-demo-endpoint.xml
│   └── web
│       ├── pom.xml
│       └── src
│           ├── main
│           │   ├── java
│           │   │   └── io
│           │   │       └── jimmysong
│           │   │           └── sofa
│           │   │               └── Slite2WebSpringBootApplication.java # 启动函数
│           │   └── resources
│           │       ├── META-INF # Spring 配置文件存放处
│           │       │   └── sofa-demo
│           │       │       └── sofa-demo-web.xml
│           │       ├── config # 配置文件目录
│           │       │   └── application.properties # 配置文件，只有在本地启动应用时使用
│           │       ├── logback-spring.xml # 应用日志配置文件
│           │       └── static # Web 工程的静态文件目录
│           │           └── index.html
│           └── test # 应用的测试模块，内置启动了 Spring Boot 方便业务测试
│               └── java
│                   └── io
│                       └── jimmysong
│                           └── sofa
│                               └── web
│                                   └── test
│                                       ├── base
│                                       │   └── AbstractTestBase.java
│                                       └── usercases
│                                           └── SofaRestServiceTest.java
├── conf
│   ├── autoconf
│   │   ├── application.properties
│   │   ├── auto-config.xml
│   │   └── tenginx-conf
│   │       └── t-alipay-tengine.conf
│   ├── bin
│   │   ├── healthcheck.sh
│   │   ├── hook.sh
│   │   ├── nginx.sh
│   │   ├── startup.sh
│   │   └── util.sh
│   └── config
│       └── java_opts
└── pom.xml

45 directories, 32 files
```

工程生成完毕，我们可以将该 Maven 工程导入到 IDE 中启动执行。

## 编译打包

执行下面的命令将应用打包。

```bash
mvn package
```

我们再看看打包完成后的 `target` 目录的结构。

```bash
target
├── autoconf 
│   ├── application.properties # 配置文件，只有在本地启动应用时使用
│   ├── auto-config.xml # 自动生成的项目配置，包括定义配置文件路径
│   └── tenginx-conf
│       └── t-alipay-tengine.conf # 配置静态资源的访问和指定端口流量的转发
├── bin
│   ├── healthcheck.sh # 健康检查脚本
│   ├── hook.sh # 定义应用启动前、启动后、终止前、终止后调用的命令
│   ├── nginx.sh # nginx 启动脚本
│   ├── startup.sh # 启动脚本
│   └── util.sh # 工具脚本
├── boot
│   └── sofa-demo-web-1.0-SNAPSHOT-executable.jar # 可执行的 Fat Jar
└── config
    └── java_opts # 配置 JVM 参数，例如内存大小

5 directories, 10 files
```

SOFA Boot 使用[外化配置的方式](https://docs.spring.io/spring-boot/docs/1.4.2.RELEASE/reference/html/boot-features-external-config.html#boot-features-external-config-application-property-files)，这些配置文件不是放在 `Fat Jar` 中的，我们可以看到 `autoconf`、`bin`、`config` 这三个目录也是我们创建工程时候自动创建的目录，它们也被拷贝到了 `target` 目录，这几个目录的作用如下：

- autoconf：本地运行时配置
- bin：启动和运行时检查
- config：JVM 配置

以上的几个目录中的配置文件如 `t-alipay-tengine.conf` 和 `auto-config.xml` 中定义了变量，支持在编译打包的时候替换。

## 运行

在本地可以像普通的 Java 应用程序一样运行，使用 `java -jar` 指定 jar 包所在路径就可以直接运行了，配置文件。

```bash
java -jar target/boot/sofa-demo-web-1.0-SNAPSHOT-executable.jar
```

但是要使用 `bin` 目录下的脚本来实现运维功能，比如启动配置注入、健康检查等我们需要一台 Linux 机器，我选择在容器里运行。

在 `target` 目录中执行如下命令：

```bash
docker run -d -it --name=jdk --hostname=sofa-demo -p 8088:8080 -v `pwd`:/home jimmysong/jdk7:7u80 /bin/bash
```

上面命令的意思是使用 `jimmysong/jdk7:7u80` 镜像（该镜像基于 CentOS7 构建，大小为 281M），将容器的主机名设置为 `sofa-demo`，容器名称为 `jdk`（该镜像只提供 JDK7，不包含应用本身，当然我们也可以把应用打包进镜像中），将本地目录 `target` 下的文件挂载到容器中的 `/home` 目录下，并将容器内的 8080 端口映射为宿主机的 8088 端口以供我们在本地通过浏览器访问。

进入容器中启动应用。

```bash
docker exec -it jdk /bin/bash
cd /home/bin
./startup.sh
# 等待大概 3 秒钟
./healthcheck.sh
        -- SOFA Boot CheckService
        -- HealthCheck URL : http://localhost:8080/health
Health Check Result
SUCCESS
```

我们看到健康检查成功，表示应用已经成功启动。

此时访问 <http://localhost:8088> 将看到如下输出。

```bash
Static Resource Pages in SOFA Boot
```

## 部署

在编译和实际部署过程中需要进行配置项替换，配置替换的方式有如下几种：

- 基于脚本做动态替换的配置方式
- 在构建过程中, 让 Maven 利用 Filter 机制执行替换。
- 基于 Profile 机制的配置
- 基于公司的服务上线平台的配置方案
- 基于 Profile + 远程拉取 Profile 配置的能力（启动过程中拉取）

## 与 Kubernetes 和 Service Mesh 的关系

### 实例管理

仅从 Web 应用来说，Spring 基于 IoC（控制反转）和 AOP（面向切面编程），需要在 Java 代码中增加很多的注解，这些代码经过 Spring 框架的渲染后在可以为应用的运行时（各种Web容器，如Tomcat、Jetty等）注入各种配置信息。而 kubernetes 是将应用使用容器的方式来部署，将 Spring 中的各种注解给移动到了应用部署的层面，也就是说运维层，可以在每次发布的时候来定义服务的依赖信息，同时在 Service mesh 中控制服务之间的流量。

### 部署方式

- 直接部署到宿主机的方式：如果是同样的服务的实例部署到了同一个主机上，必须保证应用启动的端口不冲突。
- 使用 docker 镜像并使用 kubernetes 部署的方式：每个实例一个IP地址，无需关心端口冲突问题。

### 服务治理

Istio 中的 Pilot 是为不同的后端平台，比如 Kubernetes、Mesos、Cloudfoundry 提供一个统一的服务对象表示，运维人员可以通过配置服务对象的各种规则，Pilot 会把它们下发到每个 Envoy 中，这样来实现对 Service Mesh 的管理。

我们可以考虑将服务的治理功能与应用本身结构，通过类似 [Istio](https://istio.io) 这样的架构，将应用透明

![Istio 架构](https://jimmysong.io/kubernetes-handbook/images/istio-arch-v0.1.jpg)

## 后记

本月 SOFA 框架将会有一些列组件陆续开源，敬请关注 <https://github.com/alipay>。