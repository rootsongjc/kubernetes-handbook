---
weight: 104
title: 使用 Kustomize 配置 Kubernetes 应用
date: '2023-07-04T08:40:00+08:00'
type: book
---

[Kustomize](https://kustomize.io/)是一个开源的 Kubernetes 配置管理工具，用于对 Kubernetes 清单文件进行自定义和修改。它允许用户通过分层和声明式的方式管理和定制应用程序的配置，而无需直接修改原始的清单文件，促进了配置的复用和可维护性。

Kustomize 的主要功能包括：

1. 配置合并：Kustomize 允许用户通过定义基础配置和覆盖配置的方式来合并和定制 Kubernetes 清单文件。基础配置可以作为一个基准，而覆盖配置可以包含对基础配置进行修改和定制的内容。这种分层的方式使得对配置进行管理和修改更加灵活和可维护。

2. 声明式的配置：Kustomize 使用基于文件的声明式配置格式，使得用户可以以清晰的方式描述应用程序的配置和定制需求。用户可以定义资源的名称、标签、注释、环境变量等，并指定资源之间的关系和依赖。

3. 配置重用：Kustomize 支持配置的重用和共享。用户可以定义可重用的配置片段，并在多个应用程序中进行引用。这样可以避免重复的配置，提高配置的可维护性和复用性。

4. 多环境管理：Kustomize 支持多个环境（例如开发、测试、生产）的管理。用户可以根据不同环境的需求，为每个环境创建特定的覆盖配置，并在部署过程中应用相应的配置。

## Kustomize 配置应用示例

假设我们有一个名为"myapp"的应用程序，它由多个 Kubernetes 资源组成，包括 Deployment、Service 和 ConfigMap。下面是一个使用 Kustomize 进行应用程序配置管理的简单示例。

首先，创建一个名为"base"的目录，并在该目录中创建 Kubernetes 资源的清单文件：

```
base/
  ├── deployment.yaml
  ├── service.yaml
  └── configmap.yaml
```

接下来，我们可以使用 Kustomize 创建一个 overlay 目录，用于定制基础配置。在 overlay 目录中，我们创建一个名为"dev"的子目录，并在该目录中添加一个 kustomization.yaml 文件，指定我们的定制配置：

```
overlay/
  └── dev/
      ├── kustomization.yaml
      └── configmap.yaml
```

在"dev"子目录中的 kustomization.yaml 文件中，我们可以指定要修改或添加的资源和配置：

```yaml
resources:
  - ../../base

patches:
  - configmap.yaml
```

在上面的示例中，我们指定了基础配置的位置（`../../base`），以及要应用的修改配置（`configmap.yaml`）。

最后，我们在命令行中运行 Kustomize 命令来生成最终的 Kubernetes 清单文件：

```bash
kustomize build overlay/dev
```

运行以上命令后，Kustomize 会合并基础配置和定制配置，生成包含所有修改的最终清单文件。

这是一个简单的 Kustomize 应用示例，它展示了如何使用 Kustomize 来管理应用程序的配置。通过分层的方式，我们可以对基础配置进行定制，并在不同的环境中使用相应的覆盖配置，从而实现应用程序的灵活配置管理。

## 结合 kubectl 命令使用

Kustomize 遍历 Kubernetes 清单以添加、删除或更新配置选项，而无需 fork。它既可以作为独立的二进制文件使用，也可以作为 `kubectl` 的原生功能使用。

Kustomize 与 kubectl 命令结合使用，可以将生成的 Kubernetes 清单文件部署到 Kubernetes 集群中。以下是使用 kubectl 命令与 Kustomize 一起使用的一些常见示例：

1. 生成和应用清单文件：
   使用 Kustomize 生成最终的 Kubernetes 清单文件，并直接通过 kubectl 命令将其应用到集群中。可以使用以下命令：

   ```bash
   kubectl apply -k <kustomization-directory>
   ```

   `<kustomization-directory>`是包含 kustomization.yaml 文件的目录路径，该文件描述了使用 Kustomize 生成清单文件的配置。

2. 生成清单文件并输出到标准输出：
   如果你只想生成 Kubernetes 清单文件而不直接应用它们，你可以使用以下命令：

   ```bash
   kubectl kustomize <kustomization-directory>
   ```

   这将在标准输出中生成最终的 Kubernetes 清单文件，你可以将其重定向到文件或与其他工具一起使用。

3. 查看将要应用的资源变化：
   使用 Kustomize 生成的清单文件之前，你可以通过以下命令预览将要应用的资源变化：

   ```bash
   kubectl diff -k <kustomization-directory>
   ```

   这将显示将要创建、更新或删除的资源变化列表，帮助你了解将应用的更改。

4. 删除已应用的资源：
   如果你已经使用 Kustomize 部署了应用程序，并且想要将其从集群中删除，你可以使用以下命令：

   ```bash
   kubectl delete -k <kustomization-directory>
   ```

   这将根据生成的清单文件中定义的资源进行删除操作。

这些是使用 kubectl 命令与 Kustomize 一起使用的一些示例。通过结合使用它们，你可以方便地使用 Kustomize 生成和管理 Kubernetes 清单文件，并使用 kubectl 命令与集群进行交互。

关于将 kustomize 与 kubectl 结合使用的详细说明请见 [Kubernetes 文档](https://kubernetes.io/zh-cn/docs/tasks/manage-kubernetes-objects/kustomization/)。
