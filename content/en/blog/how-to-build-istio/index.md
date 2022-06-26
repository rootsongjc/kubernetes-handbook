---
title: "How to build Istio?"
description: "This article will guide you on how to compile the Istio binaries on macOS."
date: 2022-05-15T14:18:40+08:00
draft: false
tags: ["istio"]
categories: ["Istio"]
type: "post"
image: "images/banner/build-istio.jpg"
---

This article will guide you on how to compile the Istio binaries and Docker images on macOS.

## Before you begin

Before we start, refer to the [Istio Wiki](https://github.com/istio/istio/wiki/Preparing-for-Development-Mac), here is the information about my build environment.

- macOS 12.3.1 Darwin AMD64
- Docker Desktop 4.8.1(78998)
- Docker Engine v20.10.14

## Start to compile

First, download the [Istio code](https://github.com/istio/istio) from GitHub to the `$GOPATH/src/istio.io/istio` directory, and execute the commands below in that root directory.

### Compile into binaries

Execute the following command to download the Istio dependent packages, which will be downloaded to the `vendor` directory.

```bash
go mod vendor
```

Run the following command to build Istio:

```bash
sudo make build
```

If you do not  run the command with `sudo`, you may encounter the following error.

```bash
fatal: unsafe repository ('/work' is owned by someone else)
To add an exception for this directory, call:

	git config --global --add safe.directory /work
fatal: unsafe repository ('/work' is owned by someone else)
To add an exception for this directory, call:

	git config --global --add safe.directory /work
Makefile.core.mk:170: *** "TAG cannot be empty".  Stop.
make: *** [build] Error 2
```

Even if you follow the prompts and run `git config --global --add safe.directory /work`, you will still get errors during compilation.

The compiled binary will be saved in `out` directory with the following directory structure.

```bash
out
├── darwin_amd64
│   ├── bug-report
│   ├── client
│   ├── envoy
│   ├── extauthz
│   ├── install-cni
│   ├── istio-cni
│   ├── istio-cni-taint
│   ├── istio-iptables
│   ├── istio_is_init
│   ├── istioctl
│   ├── logs
│   ├── operator
│   ├── pilot-agent
│   ├── pilot-discovery
│   ├── release
│   └── server
└── linux_amd64
    ├── envoy
    ├── envoy-centos
    ├── logs
    └── release
```

It will build both the `linux_amd64` and `darwin_amd64` architectures binaries at the same time.

### Compile into Docker images

Run the following command to compile Istio into a Docker image.

```bash
sudo make build
```

The compilation will take about 3 to 5 minutes depending on your network. Once the compilation is complete, you will see the Docker image of Istio by running the following command.

```bash
$ docker images
REPOSITORY                                         TAG                          IMAGE ID       CREATED              SIZE
localhost:5000/app_sidecar_centos_7                latest                       2044037df94b   51 seconds ago       524MB
localhost:5000/app_sidecar_ubuntu_jammy            latest                       5d8ae5ed55b7   About a minute ago   362MB
localhost:5000/proxyv2                             latest                       d4679412385f   About a minute ago   243MB
localhost:5000/install-cni                         latest                       78f46d5771d2   About a minute ago   270MB
localhost:5000/istioctl                            latest                       c38130a5adc8   About a minute ago   190MB
localhost:5000/pilot                               latest                       2aa9185ec202   About a minute ago   190MB
localhost:5000/app                                 latest                       473adafaeb8d   About a minute ago   188MB
localhost:5000/operator                            latest                       9ac1fedcdd12   About a minute ago   191MB
localhost:5000/ext-authz                           latest                       1fb5aaf20791   About a minute ago   117MB
localhost:5000/app_sidecar_debian_11               latest                       61376a02b95d   2 minutes ago        407MB
localhost:5000/app_sidecar_ubuntu_xenial           latest                       7e8efe666611   2 minutes ago        418MB
```

You can change the image name and push it into your own container registry.

## Summary

This is how to build Istio on macOS. If you have already downloaded the Docker image you need to build, the build will take less than a minute. It also takes only a few minutes to build Docker images.

## Reference

- [Using the Code Base - github.com](https://github.com/istio/istio/wiki/Using-the-Code-Base)
