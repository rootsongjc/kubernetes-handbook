---
title: "How to build Istio?"
description: "This article will guide you on how to compile the Istio binaries on macOS."
date: 2022-05-15T14:18:40+08:00
draft: false
tags: ["istio"]
categories: ["Istio"]
type: "post"
bg_image: "images/backgrounds/page-title.jpg"
image: "images/banner/build-istio.jpg"
---

This article will guide you on how to compile the Istio binaries on macOS.

## Before you begin

Before we start, refer to the [Istio Wiki](https://github.com/istio/istio/wiki/Preparing-for-Development-Mac), here is the information about my build environment.

- macOS 12.3.1 Darwin AMD64
- Docker Desktop 4.8.1(78998)
- Docker Engine v20.10.14

## Start to compile

First, download the [Istio code](https://github.com/istio/istio) from GitHub to the `$GOPATH/src/istio.io/istio` directory, and execute the commands below in that root directory.

Execute the following command to download the Istio dependent packages, which will be downloaded to the `vendor` directory.

```bash
go mod vendor
```

Run the following command to build Istio:

```bash
sudo make build
```

If you do not  run the command with `sudo`, you may encounter the following error.

```
fatal: unsafe repository ('/work' is owned by someone else)
To add an exception for this directory, call:

	git config --global --add safe.directory /work
fatal: unsafe repository ('/work' is owned by someone else)
To add an exception for this directory, call:

	git config --global --add safe.directory /work
Makefile.core.mk:170: *** "TAG cannot be empty".  Stop.
make: *** [build] Error 2
```

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

## Summary

This is how to build Istio on macOS. If you have already downloaded the Docker image you need to build, the build will take less than a minute.

## Reference

- [Using the Code Base - github.com](https://github.com/istio/istio/wiki/Using-the-Code-Base)
