---
title: "Docker 多平台构建指南：构建 WebAssembly 镜像"
description: "本文介绍了 Docker buildx 的多平台构建指南，包括构建器、并行器、缓存管理器和输出器等组件，以及常用的 docker buildx 命令及其用法。同时还介绍了如何管理和维护 Docker buildx 的构建环境，以及构建 WebAssembly 镜像的一般步骤和注意事项。"
date: 2023-04-25T19:09:28+08:00
draft: false
tags: ["docker","容器","跨平台","WebAssembly"]
categories: ["容器"]
type: "post"
image: "images/banner/docker-wasm-build.jpg"
---

Docker 多平台构建是一种用于构建 Docker 镜像以在多种 CPU 架构和操作系统上运行的技术。它可以让用户在一个 Dockerfile 中定义一个通用的构建过程，然后使用 Docker CLI 命令将其构建为多个不同平台的镜像。这些镜像可以在不同的计算机、云平台和容器编排系统上运行，从而为用户提供更广泛的部署选项。

在多平台构建中，用户需要使用 Docker Buildx 插件来构建镜像。Docker Buildx 可以构建并输出多个不同平台的镜像，包括 x86、ARM、IBM Power 等。用户可以使用该插件创建多种平台的构建环境，并使用这些环境构建镜像。

需要注意的是，多平台构建需要在支持多平台的 Docker 主机上进行。在这种主机上，Docker 可以使用 QEMU 等模拟器来模拟其他平台的环境，从而实现构建多种平台的镜像。

## 什么是 docker buildx? {#what-is-docker-buildx}

Docker Buildx 是 Docker 的一个插件，它提供了一种简单、高效的方式来构建和打包 Docker 镜像。它能够在多个平台上构建和输出 Docker 镜像，包括 Linux、Windows、macOS 等，支持 CPU 架构和操作系统等多种参数的设置。

Docker Buildx 在构建镜像时使用了 [BuildKit](https://docs.docker.com/build/buildkit/)，这是 Docker 官方推出的一个基于 Go 语言实现的高性能构建引擎。BuildKit 提供了更快的构建速度、更小的镜像体积、更好的缓存管理等优势，也可以在 Docker Buildx 之外使用。

使用 Docker Buildx，可以将不同平台上的 Docker 镜像构建合并到一个 manifest 中，使得用户只需要下载一个 manifest，就可以获取多个平台的镜像。这为跨平台开发和分发应用程序提供了很大的便利。

## Docker buildx 实现多平台构建的原理 {#docker-buildx-principles}

Docker [buildx](https://github.com/docker/buildx) 实现多平台镜像构建的原理是基于 Docker 的多架构支持。Docker 可以在一个主机上运行多个容器，每个容器运行在自己的隔离环境中，相互独立。而 Docker 镜像则是用于创建容器的基础文件系统。

在 Docker 中，不同的 CPU 架构和操作系统可以使用不同的 base image（基础镜像）进行构建。而 Docker buildx 可以自动识别当前主机的架构和操作系统，并选择合适的 base image 进行构建。在构建过程中，Docker buildx 会使用 BuildKit 引擎进行构建，支持多平台的交叉编译和镜像打包。

在构建完成后，Docker buildx 会将不同平台上的镜像打包成一个 manifest 文件，其中包含了所有平台的镜像信息。用户可以通过 Docker CLI 命令或者 Docker registry 接口来操作 manifest 文件，获取不同平台上的镜像。对于不支持多架构的 Docker 版本，可以通过安装 Docker CLI 的 experimental 版本来使用 Docker buildx。

Docker buildx 利用了 Docker 的多架构支持和 BuildKit 引擎，实现了跨平台的 Docker 镜像构建和分发。

## Docker BuildKit 引擎简介 {#docker-buildkit}

[BuildKit](https://docs.docker.com/build/buildkit/) 是 Docker 官方推出的一个高性能的构建引擎，它可以用于构建 Docker 镜像、构建应用程序以及执行其他构建任务。BuildKit 引擎采用了分布式的架构，可以并行地执行多个构建任务，提高构建效率。

BuildKit 引擎的主要特点包括：

1. 高性能：BuildKit 引擎采用了高效的缓存管理机制，能够快速地执行增量构建，减少构建时间。同时，它还能够自动优化构建过程，选择最佳的构建路径和策略，进一步提高构建性能。
2. 多平台支持：BuildKit 引擎支持多种 CPU 架构和操作系统，能够在不同平台上构建和输出 Docker 镜像。在 Docker buildx 中，BuildKit 引擎可以自动识别当前主机的架构和操作系统，并选择合适的构建方案。
3. 模块化设计：BuildKit 引擎采用了模块化的设计，可以根据需要动态加载和卸载不同的模块。这使得 BuildKit 引擎更加灵活和可扩展，可以支持各种不同的构建任务。
4. 安全性：BuildKit 引擎采用了安全的构建方式，可以自动执行一系列的安全检查，确保构建过程中不会引入漏洞或其他安全问题。同时，BuildKit 引擎还支持签名和加密等安全功能，保护用户的构建数据和镜像。

## Docker buildx 支持哪些平台？{#platforms}

Docker buildx 支持的平台主要包括以下几种：

1. Linux：包括多种 CPU 架构和操作系统，如 x86_64、ARM、IBM Power、IBM Z 等。
2. Windows：包括多种 CPU 架构和操作系统，如 x86_64、ARM64 等。
3. macOS：支持 Intel、Apple M1 架构。

除了以上平台外，Docker buildx 还支持构建和输出多种其他平台的 Docker 镜像，包括 FreeBSD、Solaris 等。用户可以通过指定对应的 `platform` 参数来构建和输出不同平台的 Docker 镜像，例如：

```bash
docker buildx build --platform linux/amd64,linux/arm64 .
```

这个命令将会构建一个同时支持 x86_64 和 ARM64 架构的 Docker 镜像。用户也可以通过指定不同的 buildx 构建配置来支持更多的平台，例如使用 qemu-user-static 等模拟器来支持其他的 CPU 架构。总之，Docker buildx 的多平台支持非常强大，为跨平台开发和分发应用程序提供了便利。

## Docker buildx 引擎的架构与组成 {#arch}

Docker buildx 引擎的架构是一个分布式的构建系统，通过多阶段、多组件的设计，实现了高性能、多平台支持、安全性等优点，为 Docker 镜像构建和应用程序构建提供了强大的支持。它由以下几个主要组成部分组成：

1. CLI：提供了命令行接口，用户可以通过命令行来执行构建任务、管理构建配置等操作。
2. BuildKit 引擎：作为 Docker buildx 的构建引擎，它负责执行构建任务，生成 Docker 镜像等。BuildKit 引擎具有高性能、多平台支持、安全性等优点。
3. 构建器（Builder）：构建器是一个 Docker 容器，它包含了构建所需要的环境和工具，可以执行构建任务。在 Docker buildx 中，可以配置多个构建器，以支持多个平台和多个构建环境。
4. 并行器（Scheduler）：并行器是负责协调和管理多个构建器的组件，它可以自动选择最佳的构建器执行构建任务，并将任务分配给合适的构建器。并行器还可以执行构建任务的并行处理，提高构建效率。
5. 缓存管理器（Cache Manager）：缓存管理器是负责管理构建过程中的缓存数据，可以快速执行增量构建，减少构建时间。在 Docker buildx 中，缓存管理器可以自动选择合适的缓存方案，包括本地缓存和远程缓存等。
6. 输出器（Exporter）：输出器负责将构建生成的 Docker 镜像输出到指定的仓库或者本地文件系统中。在 Docker buildx 中，输出器可以自动识别当前平台和目标平台，选择合适的镜像格式和输出路径。

## docker buildx 命令的使用{#command}

使用 docker buildx 命令可以方便地进行 Docker 镜像的构建和输出。下面是一些常用的 docker buildx 命令及其用法：

查看当前的 buildx 构建器列表

```bash
docker buildx ls
```

创建新的 buildx 构建器

```bash
docker buildx create --name mybuilder
```

切换到指定名称的 buildx 构建器

```bash
docker buildx use mybuilder
```

设置 buildx 构建器的平台支持

```bash
docker buildx inspect --bootstrap
docker buildx inspect --platform
docker buildx build --platform linux/amd64,linux/arm64 .
```

构建 Docker 镜像：

```bash
docker buildx build --tag myimage .
```

输出 Docker 镜像到本地文件系统

```bash
docker buildx build --output=type=local,dest=./output .
```

输出 Docker 镜像到 Docker Hub 或其他远程仓库

```bash
docker buildx build --tag myrepo/myimage --push .
```

删除指定名称的 buildx 构建器

```bash
docker buildx rm mybuilder
```

除了以上命令外，docker buildx 还支持许多其他的参数和选项，例如设置构建缓存、并行处理、构建标签等。用户可以通过查看官方文档或者使用 --help 选项来了解更多详情。

## 理解 buildx 构建器 {#builder}

在 Docker 中，构建器（Builder）是指一个 Docker 容器，它包含了构建所需要的环境和工具，可以执行构建任务。Docker buildx 构建器是指使用 BuildKit 引擎的多平台构建器，可以通过 Docker CLI 命令进行管理和操作。在使用 Docker buildx 构建器时，用户可以配置多个构建器，以支持多个平台和多个构建环境。

用户可以通过创建、切换、查看和删除构建器，来管理和维护 Docker buildx 的构建环境。构建器的主要作用是提供一个干净、独立的构建环境，避免构建过程中的依赖冲突和环境污染。此外，构建器还可以方便地进行版本管理和共享，以便多个用户或者团队协同构建 Docker 镜像。

Docker buildx 构建器还支持多平台构建，用户可以在同一个构建器中设置多个平台，以便生成跨平台的 Docker 镜像。通过 Docker buildx 构建器，用户可以轻松实现 Docker 镜像的多平台构建，提高构建效率和应用程序的兼容性。

## 为什么本地看不到 Docker buildx 构建的镜像？{#where-is-my-images}

这通常是因为你当前使用的 Docker context 不支持编译出来的镜像架构。例如 [Orbstack](https://orbstack.dev/)，虽然它支持编译跨平台的镜像，但是执行 `docker buildx` 构建出来的镜像不会直接保存在本地的 Docker 镜像仓库中，而是保存在构建器（Builder）的缓存中。这是因为 Docker buildx 采用了分层构建的方式，构建出的每一层镜像都可以被重用，以减少构建时间和磁盘空间的占用。

你应该使用 `docker context` 命令切换会 Docker 默认的上下文环境再执行构建，这样构建出来的跨平台镜像就可以在本地看见了。

## 如何将多平台镜像保存到本地？{#local-storage}

要将 Docker buildx 构建的多平台镜像保存到本地，可以使用 `--output` 选项指定输出类型为 `type=local`，并指定输出目录，例如：

```bash
docker buildx build --platform linux/amd64,linux/arm64 --output type=local,dest=./output .
```

上述命令将构建包含 `linux/amd64` 和 `linux/arm64` 两种平台的镜像，并将输出类型设置为本地（`type=local`），输出目录为 `./output`。

构建完成后，输出目录中会生成多个子目录，每个子目录分别对应一个平台，其中包含该平台下的镜像文件。

如果只想保存其中一个平台的镜像，可以在 `--output` 选项中指定要保存的平台，例如：

```bash
docker buildx build --platform linux/amd64,linux/arm64 --output type=local,dest=./output/linux/amd64 .
```

上述命令将只保存 `linux/amd64` 平台的镜像，输出到 `./output/linux/amd64` 目录中。

需要注意的是，`--output` 选项只支持部分输出类型，如果要将镜像保存到其他类型的输出（例如 tar 包、OCI 存储、Docker registry 等），需要使用其他的输出插件和选项。具体细节可以参考 [Docker 官方文档](https://docs.docker.com/build/building/multi-platform/)。

## 如何使用构建 Wasm 镜像？{#wasm}

WebAssembly 是一种中间代码格式，需要使用编译器将源代码编译为 WebAssembly 格式的二进制文件，再将其打包成镜像。以下是构建 WebAssembly 镜像的一般步骤：

1. 编写 WebAssembly 源代码，并使用编译器将其编译为 WebAssembly 格式的二进制文件。例如使用 Rust 编写代码，并使用 Cargo 编译出 `.wasm` 文件。

2. 编写 Dockerfile 将 Wasm 二进制文件添加到空镜像中。例如：

   ```Dockerfile
   # syntax=docker/dockerfile:1
   FROM scratch
   COPY ./target/wasm32-wasi/debug/hello-wasm.wasm /hello.wasm
   ENTRYPOINT [ "hello.wasm" ]
   ```

3.   使用 `docker buildx` 命令构建镜像，例如 `docker buildx build --platform wasi/wasm32 -t jimmysong/hello-wasm .`  将在本地构建。若你想将该镜像同时同时推送到 Docker Hub，可以在命令中加上 `--push`标志。基于 WebAssembly 平台的镜像并上传到 Docker Hub。

## 注意事项 {#notice}

除了构建多平台镜像、导出和加载镜像外，还有一些 Docker buildx 命令的常用操作及注意事项，包括：

1. `-progress` 选项：可以使用 `-progress` 选项指定构建过程的输出格式，包括 `auto`、`plain`、`tty` 三种格式。
2. `-no-cache` 选项：可以使用 `-no-cache` 选项禁用构建过程中的缓存机制，强制重新构建镜像。
3. `-push` 选项：可以使用 `-push` 选项将构建的镜像推送到 Docker registry 中。
4. `-tag` 选项：可以使用 `-tag` 选项为构建的镜像指定标签。
5. `-file` 选项：可以使用 `-file` 选项指定 Dockerfile 文件的路径。
6. `-build-arg` 选项：可以使用 `-build-arg` 选项传递构建参数给 Dockerfile 中的指令。
7. 构建上下文的注意事项：构建上下文指的是 Dockerfile 文件所在的目录，以及构建过程中需要用到的其他文件。在构建过程中需要尽量减少构建上下文的大小，避免构建过程中传输大量不必要的文件。可以使用 `.dockerignore` 文件排除不需要传输的文件。

需要注意的是，Docker buildx 是一个比较新的命令，不同版本的 Docker Engine 可能会存在差异，因此在使用时需要注意查阅官方文档，并根据实际情况进行操作。
