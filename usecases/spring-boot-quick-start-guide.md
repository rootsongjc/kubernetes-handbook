# Spring Boot快速开始指南

Spring Boot已成为当今最流行的微服务开发框架，本文是如何使用Spring Boot快速开始Web微服务开发的指南，我们将使创建一个可运行的包含内嵌Web容器（默认使用的是Tomcat）的可运行Jar包。

Spring Boot旨在简化创建产品级的Spring应用和服务，简化了配置文件，使用嵌入式web服务器，含有诸多开箱即用微服务功能，可以和spring cloud联合部署。

传统的Spring应用程序需要配置大量的XML文件才能运行，而使用Spring Boot只需极少的配置，就可以快速获得一个正常运行的Spring应用程序，而这些配置使用的都是注解的形式，不需要再配置XML。

与Go语言的应用不同，我们知道所有的Java Web应用都必须放在servlet容器（不是像docker容器的那种容器），如Tomcat、Jetty等。Servlet容器被定位为托管web应用程序的高可用组件。关于Servlet的教程请参考[Servlet教程 | runoob.com](http://www.runoob.com/servlet/servlet-tutorial.html)。

## Spring的基本原理

Spring是一套Java开发框架，框架的作用就是为了减少代码的冗余和模块之间的偶尔，使代码逻辑更加清晰，主要是用了[AOP](https://docs.spring.io/spring/docs/2.5.x/reference/aop.html)（Aspect Oriented Programming，面向切面编程）和IoC（Inversion of Control，控制反转）容器的思想，其中AOP是利用了Java的反射机制实现的。为了便于理解AOP可以参考[一个简单的Spring的AOP例子](http://www.blogjava.net/javadragon/archive/2006/12/03/85115.html)。

## 准备环境

在开始Spring Boot开发之前，需要先确认您的电脑上已经有以下环境：

- JDK8
- Maven3.0+
- Intellij IDEA

JDK最好使用JDK8版本，Maven和IDEA的安装都十分简单，Maven的仓库配置有必要说一下。

### 配置Maven

在安装好Maven之后，默认的`~/.m2`目录下是没有maven仓库配置文件`settings.xml`的，默认使用的是官方的仓库，访问速度会非常慢，我们需要配置下国内的仓库。

创建`~/.m2/settings.xml`文件，文件内容如下：

```xml
<?xml version="1.0"?>
<settings>
  <mirrors>
        <mirror>
            <id>alimaven</id>
            <name>aliyun maven</name>
            <url>http://maven.aliyun.com/nexus/content/groups/public/</url>
            <mirrorOf>central</mirrorOf>
        </mirror>
  </mirrors>
  <profiles>
    <profile>
       <id>nexus</id>
        <repositories>
            <repository>
                <id>nexus</id>
                <name>local private nexus</name>
                <url>http://maven.oschina.net/content/groups/public/</url>
                <releases>
                    <enabled>true</enabled>
                </releases>
                <snapshots>
                    <enabled>false</enabled>
                </snapshots>
            </repository>
        </repositories>

        <pluginRepositories>
            <pluginRepository>
            <id>nexus</id>
            <name>local private nexus</name>
            <url>http://maven.oschina.net/content/groups/public/</url>
            <releases>
                <enabled>true</enabled>
            </releases>
            <snapshots>
                <enabled>false</enabled>
            </snapshots>
            </pluginRepository>
        </pluginRepositories>
    </profile></profiles>
</settings>
```

其中使用的是阿里云的mirror，国内的下载速度非常快。

## 创建第一个Spring Boot应用

我们可以使用以下两种方式创建Spring Boot应用：

- springboot
- maven

### 使用springboot命令创建Spring Boot应用

首先需要安装`springboot`命令行工具。

```bash
brew tap pivotal/tap
brew install springboot
```

使用下面的命令创建应用。

```bash
spring init --build maven --groupId com.example --version 0.0.1-SNAPSHOT --java-version 1.8 --dependencies web --name myproject myproject
```

- `--build`使用maven编译或者是gradle
- `--groupId`和`--version`与maven的`pom.xml`中的设置对应
- `--dependencies`可以指定多个，如`web`、`jpa`、`security`等starter

执行上述命令后，将创建如下的目录结构：

```bash
.
└── myproject
    ├── mvnw
    ├── mvnw.cmd
    ├── pom.xml
    └── src
        ├── main
        │   ├── java
        │   │   └── com
        │   │       └── example
        │   │           └── myproject
        │   │               └── MyprojectApplication.java
        │   └── resources
        │       ├── application.properties
        │       ├── static
        │       └── templates
        └── test
            └── java
                └── com
                    └── example
                        └── myproject
                            └── MyprojectApplicationTests.java

15 directories, 6 files
```

运行默认的示例应用。

```bash
mvn spring-boot:run
```

第一次运行需要下载依赖包所以会比较耗费时间，以后每次编译运行速度就会很快。

在浏览器中访问<localhost:8080>将看到如下输出：

```bash
Whitelabel Error Page
This application has no explicit mapping for /error, so you are seeing this as a fallback.

Mon Mar 12 16:26:42 CST 2018
There was an unexpected error (type=Not Found, status=404).
No message available
```

### 使用Maven创建Spring Boot应用

使用Maven创建Spring Boot应用需要执行以下步骤：

1. 创建Maven工程所需的`pom.xml`文件
2. 生成Maven工程
3. 编译打包发布

#### 创建pom.xml

为Maven项目构建创建`pom.xml`文件，内容如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>myproject</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>1.4.1.BUILD-SNAPSHOT</version>
    </parent>

    <repositories>
        <repository>
            <id>spring-snapshots</id>
            <url>http://repo.spring.io/snapshot</url>
            <snapshots><enabled>true</enabled></snapshots>
        </repository>
        <repository>
            <id>spring-milestones</id>
            <url>http://repo.spring.io/milestone</url>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>spring-snapshots</id>
            <url>http://repo.spring.io/snapshot</url>
        </pluginRepository>
        <pluginRepository>
            <id>spring-milestones</id>
            <url>http://repo.spring.io/milestone</url>
        </pluginRepository>
    </pluginRepositories>
    <!-- 添加classpath依赖 -->
    <dependencies>
    	<dependency>
   	 	    <groupId>org.springframework.boot</groupId>
   		    <artifactId>spring-boot-starter-web</artifactId>
	    </dependency>
        <!-- 开发者工具，当classpath下有文件更新自动触发应用重启 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <optional>true</optional>
        </dependency>
	</dependencies>
    <!-- maven编译插件，用于创建可执行jar包 -->
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

现在执行`mvn dependency:tree`可以看到项目中的依赖关系。

```bash
com.example:myproject:jar:0.0.1-SNAPSHOT
\- org.springframework.boot:spring-boot-starter-web:jar:1.4.1.BUILD-SNAPSHOT:compile
   +- org.springframework.boot:spring-boot-starter:jar:1.4.1.BUILD-SNAPSHOT:compile
   |  +- org.springframework.boot:spring-boot:jar:1.4.1.BUILD-SNAPSHOT:compile
   |  +- org.springframework.boot:spring-boot-autoconfigure:jar:1.4.1.BUILD-SNAPSHOT:compile
   |  +- org.springframework.boot:spring-boot-starter-logging:jar:1.4.1.BUILD-SNAPSHOT:compile
   |  |  +- ch.qos.logback:logback-classic:jar:1.1.7:compile
   |  |  |  +- ch.qos.logback:logback-core:jar:1.1.7:compile
   |  |  |  \- org.slf4j:slf4j-api:jar:1.7.21:compile
   |  |  +- org.slf4j:jcl-over-slf4j:jar:1.7.21:compile
   |  |  +- org.slf4j:jul-to-slf4j:jar:1.7.21:compile
   |  |  \- org.slf4j:log4j-over-slf4j:jar:1.7.21:compile
   |  +- org.springframework:spring-core:jar:4.3.3.RELEASE:compile
   |  \- org.yaml:snakeyaml:jar:1.17:runtime
   +- org.springframework.boot:spring-boot-starter-tomcat:jar:1.4.1.BUILD-SNAPSHOT:compile
   |  +- org.apache.tomcat.embed:tomcat-embed-core:jar:8.5.5:compile
   |  +- org.apache.tomcat.embed:tomcat-embed-el:jar:8.5.5:compile
   |  \- org.apache.tomcat.embed:tomcat-embed-websocket:jar:8.5.5:compile
   +- org.hibernate:hibernate-validator:jar:5.2.4.Final:compile
   |  +- javax.validation:validation-api:jar:1.1.0.Final:compile
   |  +- org.jboss.logging:jboss-logging:jar:3.3.0.Final:compile
   |  \- com.fasterxml:classmate:jar:1.3.1:compile
   +- com.fasterxml.jackson.core:jackson-databind:jar:2.8.3:compile
   |  +- com.fasterxml.jackson.core:jackson-annotations:jar:2.8.3:compile
   |  \- com.fasterxml.jackson.core:jackson-core:jar:2.8.3:compile
   +- org.springframework:spring-web:jar:4.3.3.RELEASE:compile
   |  +- org.springframework:spring-aop:jar:4.3.3.RELEASE:compile
   |  +- org.springframework:spring-beans:jar:4.3.3.RELEASE:compile
   |  \- org.springframework:spring-context:jar:4.3.3.RELEASE:compile
   \- org.springframework:spring-webmvc:jar:4.3.3.RELEASE:compile
      \- org.springframework:spring-expression:jar:4.3.3.RELEASE:compile
```

这其中包括Tomcat web服务器和Spring Boot自身。

##### Spring Boot 推荐的基础 POM 文件

| 名称                             | 说明                                                         |
| -------------------------------- | ------------------------------------------------------------ |
| spring-boot-starter              | 核心 POM，包含自动配置支持、日志库和对 YAML 配置文件的支持。 |
| spring-boot-starter-amqp         | 通过 spring-rabbit 支持 AMQP。                               |
| spring-boot-starter-aop          | 包含 spring-aop 和 AspectJ 来支持面向切面编程（AOP）。       |
| spring-boot-starter-batch        | 支持 Spring Batch，包含 HSQLDB。                             |
| spring-boot-starter-data-jpa     | 包含 spring-data-jpa、spring-orm 和 Hibernate 来支持 JPA。   |
| spring-boot-starter-data-mongodb | 包含 spring-data-mongodb 来支持 MongoDB。                    |
| spring-boot-starter-data-rest    | 通过 spring-data-rest-webmvc 支持以 REST 方式暴露 Spring Data 仓库。 |
| spring-boot-starter-jdbc         | 支持使用 JDBC 访问数据库。                                   |
| spring-boot-starter-security     | 包含 spring-security。                                       |
| spring-boot-starter-test         | 包含常用的测试所需的依赖，如 JUnit、Hamcrest、Mockito 和 spring-test 等。 |
| spring-boot-starter-velocity     | 支持使用 Velocity 作为模板引擎。                             |
| spring-boot-starter-web          | 支持 Web 应用开发，包含 Tomcat 和 spring-mvc。               |
| spring-boot-starter-websocket    | 支持使用 Tomcat 开发 WebSocket 应用。                        |
| spring-boot-starter-ws           | 支持 Spring Web Services。                                   |
| spring-boot-starter-actuator     | 添加适用于生产环境的功能，如性能指标和监测等功能。           |
| spring-boot-starter-remote-shell | 添加远程 SSH 支持。                                          |
| spring-boot-starter-jetty        | 使用 Jetty 而不是默认的 Tomcat 作为应用服务器。              |
| spring-boot-starter-log4j        | 添加 Log4j 的支持。                                          |
| spring-boot-starter-logging      | 使用 Spring Boot 默认的日志框架 Logback。                    |
| spring-boot-starter-tomcat       | 使用 Spring Boot 默认的 Tomcat 作为应用服务器。              |

所有这些 POM 依赖的好处在于为开发 Spring 应用提供了一个良好的基础。Spring Boot 所选择的第三方库是经过考虑的，是比较适合产品开发的选择。但是 Spring Boot 也提供了不同的选项，比如日志框架可以用 Logback 或 Log4j，应用服务器可以用 Tomcat 或 Jetty。

### 生成Maven工程

对于普通的Java项目或者Java Web项目可以使用下面的命令创建maven结构：

```bash
mvn archetype:generate -DgroupId=com.example -DartifactId=myproject -DarchetypeArtifactId=maven-archetype-webapp -DinteractiveMode=false
```

下表是以上参数的使用说明：

| 参数                   | 说明                                                         |
| ---------------------- | ------------------------------------------------------------ |
| mvn archetype:generate | 固定格式                                                     |
| -DgroupId              | 组织标识（包名）                                             |
| -DartifactId           | 项目名称                                                     |
| -DarchetypeArtifactId  | 指定ArchetypeId，maven-archetype-quickstart，创建一个Java Project；maven-archetype-webapp，创建一个Web Project |
| -DinteractiveMode      | 是否使用交互模式                                             |

这将生成以下的目录结构：

```bash
.
└── myproject
    ├── pom.xml
    └── src
        └── main
            ├── resources
            └── webapp
                ├── WEB-INF
                │   └── web.xml
                └── index.jsp

6 directories, 3 files
```

对于Spring Boot项目，无法使用`mvn`命令直接生成，需要手动创建目录：

```bash
mkdir -p src/main/java
```

#### 创建示例代码

创建`src/main/java/Example.java`文件内容如下：

```java
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.stereotype.*;
import org.springframework.web.bind.annotation.*;

@RestController
@EnableAutoConfiguration
public class Example {

    @RequestMapping("/")
    String home() {
        return "Hello World!";
    }

    public static void main(String[] args) throws Exception {
        SpringApplication.run(Example.class, args);
    }

}
```

- `@RestController`注解告诉Spring以字符串的形式渲染结果，并直接返回给调用者。
- `@EnableAutoConfiguration`注解告诉Spring Boot根据添加的jar依赖猜测你想如何配置Spring。由于`spring-boot-starter-web`添加了Tomcat和Spring MVC，所以auto-configuration将假定你正在开发一个web应用，并对Spring进行相应地设置。
- `@RequestMapping`注解提供路由信息，它告诉Spring任何来自"/"路径的HTTP请求都应该被映射到`home`方法。

**注**：`@RestController`和`@RequestMapping`是Spring MVC中的注解（它们不是Spring Boot的特定部分）。

#### 编译和发布

运行该项目有以下两种方式。

**方式1：直接mvn命令运行**

```bash
mvn spring-boot:run
```

**方式2：编译打包成可执行jar包**

```bash
mvn package
java -jar target/myproject-0.0.1-SNAPSHOT.jar
```

不论使用哪种方式编译，访问<localhost:8080>可以看到web页面上显示`Hello world!`。

在`target`目录下，你应该还能看到一个很小的名为`myproject-0.0.1-SNAPSHOT.jar.original`的文件，这是在Spring Boot重新打包前，Maven创建的原始jar文件。实际上可运行jar包中包含了这个小的jar包。

# 参考

- [Spring官方网站](https://spring.io/)
- [Spring core technologies - spring.io](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html)
- [Spring Boot——开发新一代Spring Java应用](https://www.tianmaying.com/tutorial/spring-boot-overview)
- [Spring MVC快速入门教程](https://www.tianmaying.com/tutorial/spring-mvc-quickstart)
- [Spring Boot Reference Guide中文翻译 -《Spring Boot参考指南》](https://github.com/qibaoguang/Spring-Boot-Reference-Guide)
- [使用 Spring Boot 快速构建 Spring 框架应用](https://www.ibm.com/developerworks/cn/java/j-lo-spring-boot/)
- [maven3常用命令、java项目搭建、web项目搭建详细图解](http://blog.csdn.net/edward0830ly/article/details/8748986)
- [Servlet教程 - runoob.com](http://www.runoob.com/servlet/servlet-tutorial.html)
- [AOP - Aspect Oriented Programming - spring.io](https://docs.spring.io/spring/docs/2.5.x/reference/aop.html)