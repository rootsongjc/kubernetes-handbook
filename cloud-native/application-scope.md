# Application Scope

本文基于 OAM v1alpha2 版本。

`ApplicationScope` 根据 `Component` 中的应用逻辑或共同行为划定作用域，将其分组以便于管理。

`ApplicationScope` 具有以下特征：

- 一个 `Component` 可能属于一个或多个 `ApplicationScope`；
- 有的 `ApplicationScope` 可以限定其中是否可以部署同一个 `Component` 的多个实例；
- `ApplicationScope` 可以作为 `Component` 与基础设施的连接层，提供身份、网络或安全能力；
- `Trait` 可以根据 `Component` 中定义的 `ApplicationScope` 来执行适当的运维特性；

目前 OAM 中支持的核心应用范围类型有 [`NetworkScope`](https://github.com/oam-dev/spec/blob/master/standard/scopes/network_scope.md) 和 [`HealthScope`](https://github.com/oam-dev/spec/blob/master/standard/scopes/health_scope.md)。

下面是使用 `NetworkScope` 来声明作用域的示例：

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: NetworkScope
metadata:
  name: my-network
  labels:
    region: my-region
    environment: production
spec:
  networkId: my-network
  subnetIds:
  - my-subnetwork-01
  - my-subnetwork-02
  - my-subnetwork-03
  internetGatewayType: nat
```

上面的示例的作用是将三个子网划定为一组网络边界，这通常是使用 VPC 实现。

关于 `ApplicationScope` 的详细信息请参考 OAM 中的 [ApplicationScope 规范](https://github.com/oam-dev/spec/blob/master/5.application_scopes.md)。

## 参考

- [The Open Application Model specification - github.com](https://github.com/oam-dev/spec)