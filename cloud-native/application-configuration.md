# Application Configuration

本文基于 OAM v1alpha2 版本。

`ApplicationConfiguration` 将 `Component` 与 `Trait` 组合，定义了一个应用程序的配置，`Component` 每部署一次就会产生一个实例（`Instance`），实例是可以被升级的（包括回滚和重新部署），而每次部署和升级就会产生一次新的发布（`Release`）。

> [12 因素应用](https://12factor.net/zh_cn/)严格区分[构建、发布、运行](https://12factor.net/zh_cn/build-release-run)这三个步骤。每次构建和修改配置后都会产生一次新的发布（`Release`）。OAM 中将 `Component`、`Trait`、`ApplicaitonScope` 组合而成的 `ApplicationConfiguration` 即等同于 `Release`。每次对 `ApplciationConfiguration` 的更新都会创建一个新的 `Release`（跟 [Helm](https://helm.sh) 中的 `Release` 概念一致）。

下面是一个 `ApplicationConfiguration` 示例。

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: ApplicationConfiguration
metadata:
  name: my-app
  annotations:
    version: v1.0.0
    description: "My first application deployment."
spec:
  components:
    - componentName: my-component
      parameterValues:
        - name: PARAMETER_NAME
          value: SUPPLIED_VALUE
        - name: ANOTHER_PARAMETER
          value: "AnotherValue"
      traits:
        - name: manualscaler.core.oam.dev
          version: v1
          spec:
            replicaCount: 3
      scopes:
        - scopeRef:
            apiVersion: core.oam.dev/v1alpha2
            kind: NetworkScope
            name: my-network
```

关于 `ApplicationConfiguration` 的详细信息参考 OAM 中的 [ApplicationConfiguration 规范](https://github.com/oam-dev/spec/blob/master/7.application_configuration.md)。

## 参考

- [The Open Application Model specification - github.com](https://github.com/oam-dev/spec)