---
title: "使用 WebAssembly 扩展 Istio EnvoyFilter 的功能"
description: "本篇博客旨在为大家推荐几款实用且易于上手的 AI 工具，希望能够帮助大家提高工作效率，更好地应用 AI 技术。"
date: 2023-03-07T09:09:40+08:00
draft: true
tags: ["AI"]
categories: ["其他"]
type: "post"
image: "images/banner/house.jpg"
---

## WebAssembly 简介

沙盒、WASI、安全性、

## EnvoyFilter 简介



## Istio 对  WebAssembly 扩展支持的历史

Istio 对 WebAssembly 扩展的支持历史如下：

1. 2018 年下半年 Google 的 Istio 团队就开始与 Envoy 社区合作使用 WebAssembly 为 Envoy 添加动态扩展，并在 2020 年初发布的 1.5 版本（Istio 历史上最重大的版本之一）中抛弃了 Mixer，转而使用 WebAssembly 构建可扩展模型。Istio 1.5  版本中推出了 [Proxy-Wasm](https://github.com/proxy-wasm)，定义了 [ABI 规范](https://github.com/proxy-wasm/spec)和 SDK（[Rust](https://github.com/proxy-wasm/proxy-wasm-rust-sdk)、[C++](https://github.com/proxy-wasm/proxy-wasm-cpp-sdk)）；
2. 在 Istio 1.7 版本中，引入了一种新的 Istio 扩展点，称为"EnvoyFilter"。使用 EnvoyFilter，用户可以编写自定义的 Istio Envoy Filter，并以 WebAssembly 二进制格式部署它们。这意味着用户可以使用任何 WebAssembly 支持的编程语言编写 Istio 扩展程序，例如 Rust，C ++，Go 等。
3. Istio 的 WebAssembly 扩展支持在 Istio 1.7 版本中还处于实验阶段，但是随着 Istio 的发展和改进，这个特性得到了更加稳定和完善的支持。例如，Istio 1.10 版本中引入了更多的 WebAssembly 扩展程序示例，以及用于验证和测试这些扩展程序的工具。
4. 2021 年底发布的 1.12 版本，引入了 WasmPlugin API alpha 功能，你可以轻松地将自定义插件部署到单个代理，甚至是整个网格。

## WebAssemblyHub

https://docs.solo.io/web-assembly-hub/latest/tutorial_code/

## 如何为 Envoy 代理配置 WebAssembly 扩展？

要为 Envoy 代理配置 WebAssembly 扩展，请按照以下步骤操作：

1.  在 Envoy 代理上启用 WebAssembly 扩展功能。您可以通过在 Envoy 配置文件中设置`--enable-extensions "wasm"`选项来启用此功能。
    
2.  编写 WebAssembly 扩展。您可以使用任何编程语言编写 WebAssembly 扩展，只需确保使用了支持的 WebAssembly 运行时（例如，可以使用 Rust，C ++，Go 等）。
    
3.  将 WebAssembly 扩展编译为`.wasm`文件。这可以通过使用支持 WebAssembly 的编译器完成。例如，如果您使用 Rust 编写扩展程序，则可以使用 Rust 编译器将其编译为 WebAssembly 二进制文件。
    
4.  将`.wasm`文件添加到 Envoy 配置文件中的`http_filters`部分。在配置文件中，您需要指定扩展程序的名称，路径和配置选项。例如，以下是一个示例配置：
    

```yaml
http_filters:
- name: envoy.filters.http.wasm
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.filters.http.wasm.v3.Wasm
    name: my_wasm_extension
    config:
      vm_config:
        runtime: "envoy.wasm.runtime.v8"
        code:
          local:
            filename: "/path/to/my_wasm_extension.wasm"
```

5.  重新加载 Envoy 代理以加载新的 WebAssembly 扩展。

这些步骤应该可以帮助您在 Envoy 代理上配置 WebAssembly 扩展。注意，这只是一个简单的指南，实际上可能会涉及更多的步骤和配置选项，具体取决于您的具体环境和需求。建议查看 Envoy 的官方文档和示例以获取更多帮助。

## EnvoyFilter


> 你是一个技术专家，要写一篇关于使用 WebAssembly 开发 Istio 中的 EnvoyFilter 的博客，请拟一个标题并撰写博客。

Istio 是一个非常流行的服务网格，它的 Envoy 代理是整个系统的核心组件。EnvoyFilter 是一个强大的工具，可以在 Envoy 的运行时动态修改和扩展 Envoy 的功能。在 Istio 中，EnvoyFilter 经常被用来实现流量管理、安全和监控等功能。

最近，WebAssembly（简称 Wasm）已经成为了一种非常热门的技术。它可以将高性能的二进制代码在多种不同的平台上运行，包括 Web 浏览器、移动设备和服务器。现在，WebAssembly 可以在 Envoy 中使用，这为 EnvoyFilter 的开发带来了全新的可能性。

在本文中，我们将介绍如何使用 WebAssembly 开发 Istio EnvoyFilter。具体地说，我们将演示如何使用 WebAssembly 扩展 Envoy 的 HTTP 过滤器。在本文中，我们将使用 Rust 编程语言来编写我们的 WebAssembly 模块。

首先，我们需要准备好开发环境。要使用 Rust 开发 WebAssembly 模块，需要安装 Rust 编程语言和 wasm-pack 工具。wasm-pack 是一个 Rust 包装工具，它可以将 Rust 代码编译成 WebAssembly 模块。

接下来，我们将创建一个 Rust 项目，并使用 wasm-pack 初始化它。初始化完成后，我们将在 src 目录下创建一个名为 main.rs 的文件，并编写我们的 Rust 代码。在本例中，我们将编写一个简单的 HTTP 过滤器，它会检查请求中的特定标头，并在响应中添加另一个标头。

## 使用 Rust 编写 HTTP 过滤器

当使用 WebAssembly 扩展 Istio EnvoyFilter 功能时，使用 Rust 编程语言是非常方便和流行的选择。在本文中，我们将演示如何使用 Rust 编写一个简单的 HTTP 过滤器，并将其部署到 Istio Envoy 中。

我们首先需要安装 Rust 编程语言和 wasm-pack 工具。可以通过以下链接访问官方网站来进行安装：

- Rust 编程语言：https://www.rust-lang.org/
- wasm-pack 工具：https://rustwasm.github.io/wasm-pack/installer/

安装完成后，我们可以创建一个 Rust 项目，并使用 wasm-pack 初始化它。在项目目录下，运行以下命令：

```bash
$ wasm-pack init my-project
```

这将会创建一个名为 `my-project` 的 Rust 项目，并在其中生成一些示例代码。在 `src` 目录下，我们将创建一个名为 `main.rs` 的文件，并编写我们的 Rust 代码。

在本例中，我们将编写一个简单的 HTTP 过滤器，它将检查请求中的特定标头，并在响应中添加另一个标头。具体来说，我们将检查请求中的 "Authorization" 标头，并在响应中添加一个 "X-Test" 标头。以下是完整的代码：

```rust
use std::convert::TryFrom;
use std::str;

use wasmtime::*;
use envoy_proxy_wasm::traits::*;
use envoy_proxy_wasm::types::*;
use envoy_proxy_wasm::hostcalls::*;

#[no_mangle]
pub fn proxy_on_http_request_headers(_num_headers: usize) -> Action {
    // Get the value of the "Authorization" header
    let auth_header = get_header_map_value(":authority");
    match auth_header {
        Some(val) => {
            // Set the "X-Test" header in the response
            set_header_map_value("x-test", &val);
        },
        None => (),
    }

    // Continue processing the request
    Action::Continue
}

#[no_mangle]
pub fn proxy_on_vm_start(_vm_configuration_size: usize) -> bool {
    true
}
```

在上面的代码中，我们首先导入一些必要的 Rust 模块和类型。然后，我们定义了两个函数 `proxy_on_http_request_headers` 和 `proxy_on_vm_start`。

`proxy_on_vm_start` 函数将在 Envoy 启动时调用。在本例中，我们只需返回 `true` 即可。

`proxy_on_http_request_headers` 函数将在每个 HTTP 请求的头部被处理时调用。在这个函数中，我们首先获取请求头部中的 "Authorization" 值。如果 "Authorization" 值存在，我们将设置响应头部的 "X-Test" 值为 "Authorization" 值。然后，我们返回 `Action::Continue`，表示继续处理请求。

编写完 Rust 代码后，我们需要将其编译为 WebAssembly 模块。为此，我们可以使用 `wasm-pack build` 命令。在项目目录下运行以下命令：

```bash
$ wasm-pack build --release --target=web
```

这将会在 `pkg` 目录下生成一个名为 `my-project_bg.wasm` 的 WebAssembly 模块。现在我们可以将其部署到 Istio Envoy 中。

首先，我们需要创建一个名为 `filter.yaml` 的 EnvoyFilter 配置文件。以下是示例配置：

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: EnvoyFilter
metadata:
  name: http-filter
spec:
  configPatches:
  - applyTo: HTTP_FILTER
    match:
      context: SIDECAR_OUTBOUND
      listener:
        filterChain:
          filter:
            name: envoy.filters.network.http_connection_manager
            subFilter:
              name: envoy.filters.http.router
    patch:
      operation: INSERT_BEFORE
      value:
        name: envoy.filters.http.wasm
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.http.wasm.v3.Wasm
          name: my-http-filter
          config:
            # Replace this with the absolute path to your compiled wasm file.
            # Note that the path must be relative to the istio-proxy container.
            path: /var/local/lib/my-project_bg.wasm
            vm_config:
              # Replace this with the name of your Rust module and the function that
              # should be called on HTTP request headers.
              runtime: "envoy.wasm.runtime.v8"
              code:
                name: my-http-filter
                # The `proxy_on_http_request_headers` function will be called on HTTP request headers.
                # Replace this with the name of your function.
                # The `proxy_on_vm_start` function will be called on Envoy start.
                # Replace this with the name of your function.
                configuration: "{\"proxy_on_http_request_headers\":\"proxy_on_http_request_headers\",\"proxy_on_vm_start\":\"proxy_on_vm_start\"}"
```

在上面的配置文件中，我们定义了一个 EnvoyFilter，并指定了要在 HTTP 过滤器中插入 WebAssembly 模块。在 `path` 字段中，我们指定了要使用的 WebAssembly 模块的位置。在 `configuration` 字段中，我们指定了要调用的 Rust 函数名称。

将上面的配置文件保存为 `filter.yaml` 文件，并使用 kubectl 命令将其部署到 Kubernetes 中：

```bash
$ kubectl apply -f filter.yaml
```

现在，我们已经成功将 Rust 编写的 HTTP 过滤器部署到了 Istio Envoy 中。当 Envoy 处理 HTTP 请求时，它将调用我们的 Rust 函数，并执行我们指定的逻辑。

在本文中，我们演示了如何使用 Rust 和 WebAssembly 扩展 Istio EnvoyFilter 的功能。通过这种方式，我们可以使用 Rust 的高性能和类型安全性来编写可扩展的 Envoy 过滤器。

## 编译 WebAssembly 模块

编写完 Rust 代码后，我们需要将其编译为 WebAssembly 模块。为此，我们可以使用 wasm-pack build 命令。编译完成后，我们将获得一个名为 filter.wasm 的 WebAssembly 模块。

现在，我们可以将 filter.wasm 模块上传到 Istio Envoy 中，并将其配置为一个 EnvoyFilter。为了实现这一点，我们需要创建一个名为 filter.yaml 的 YAML 文件，并将其上传到 Istio 控制平面中。在 filter.yaml 中，我们将指定我们的 WebAssembly 模块的位置和配置。

在配置文件中，我们可以指定哪些 HTTP 请求应该被我们的 EnvoyFilter 拦截，并指定我们的 WebAssembly 模块应该如何处理这些请求。在本例中，我们将检查请求中的 "Authorization" 标头，并在响应中添加一个 "X-Test" 标头。

现在，我们已经成功地使用 WebAssembly 扩展了 Istio EnvoyFilter 的功能。使用 WebAssembly，我们可以编写高性能的 EnvoyFilter，并将它们部署到多个平台上。如果您对此感兴趣，可以深入了解 WebAssembly 和 Istio EnvoyFilter

## Istio 中的 WebAssembly 使用案例

默认情况下，遥测数据是在 Envoy 代理中内置支持的，不需要特别指定。如果你想使用基于 WebAssembly 实现遥测，你可在安装 Istio 的时候指定使用 `preview`  profile，或者使用 `default` profile 但是需要进行特别设置，详见 [ Wasm-based Telemtry](https://istio.io/latest/docs/reference/config/proxy_extensions/wasm_telemetry/)。

但是，基于 WebAssembly 生成的遥测数据有一些限制：

- 在 Wasm 模块加载期间（即应用上述配置时），代理 CPU 使用率将达到峰值。增加代理 CPU 资源限制将有助于加快加载速度。
- 代理基准资源使用量增加。根据初步的性能测试结果，与默认安装相比，运行基于 Wasm 的遥测将多消耗 30%~50% 的 CPU 和双倍的内存使用量。

## 参考 {#reference}

- [Redefining extensibility in proxies - introducing WebAssembly to Envoy and Istio - istio.io](https://istio.io/latest/blog/2020/wasm-announce/)
- [Announcing the alpha availability of WebAssembly Plugins - istio.io](https://istio.io/latest/blog/2021/wasm-api-alpha/)
- [Istio and Envoy WebAssembly Extensibility, One Year On - istio.io](https://istio.io/latest/blog/2021/wasm-progress/)
- [WebAssemblyHub Tutorials - docs.solo.io](https://docs.solo.io/web-assembly-hub/latest/tutorial_code/)