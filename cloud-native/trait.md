# Trait

本文基于 OAM v1alpha2 版本。

`Trait` 用于定义 `Component` 的运维属性，是对 `Component` 运行时的叠加，需要通过 `ApplicationConfiguration` 的配置将其与 `Component` 绑定，用于动态修改 `Component` 中 `workload` 的行为。

不同的 `Trait` 可能适用于不同的 `Component`（因为不同的 `Component` 中的  `workload` 可能不同，因此它们的运维特性也可能不同），如流量路由规则（如负载均衡策略、入口路由、出口路由、百分比路由、限流、熔断、超时限制、故障注入等）、自动缩放策略、升级策略、发布策略等。

`Trait` 还具有以下几个特征：

- `Trait` 是根据在 `Component` 中引用的顺序应用的，如果某些运维特征本身具有依赖性，可以通过显式排序来解决；
- 对于某一类型的 `Trait` 在同一个 `Component` 实例只能应用一个；
- 在应用 `Trait` 时，需要进行冲突检查，如果一组 `Trait` 的特性不能满足运维组合，则判定为不合法；

将运维属性从应用组件本身的定义（ `Component`）中剥离有如下几个好处：

- `Trait` 通常由应用运维人员定义和维护，而不需要应用开发人员参与，应用开发人员对 `Trait` 可能无感知，减轻了应用开发人员的负担；
- `Trait` 将云原生应用程序的一些通用运维属性从应用配置中剥离出来，大大提高了运维逻辑的可复用性；
- 应用 `Trait` 组合前进行运维特性检查，可以有效防止配置冲突和无法预期的情况发生；

下面是根据 OAM 规范定义的一个 Trait 示例。

```yaml
apiVersion: core.oam.dev/v1alpha2
kind: TraitDefinition
metadata:
  name: manualscalertrait.core.oam.dev
spec:
  appliesToWorkloads:
    - core.oam.dev/v1alpha2.ContainerizedWorkload
  definitionRef:
    name: manualscalertrait.core.oam.dev
```

> CR  即 Custom Resource（自定义资源），指的是实例化后的 Kubernetes [CRD](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)。`definitionRef` 将 `Trait` shcema 在 OAM 解释器中注册，通过增加一个抽象层，使其与 Operator 框架解耦（毕竟不是所有 CRD 都是面向应用开发者的）。

OAM 中将 `Trait` 分成了 `core.oam.dev`（核心）、`standard.oam.dev`（标准）及自定义扩展类别。一个 `Trait` 具体适用于哪些 `workload` 可以在 `Trait` 的 `TraitDefinition` 中定义。目前 OAM 中支持的核心 `Trait` 有 [`ManualScalerTrait`](https://github.com/oam-dev/spec/blob/master/core/traits/manual_scaler_trait.md)。

关于 Trait 的详细请参考 OAM 中的 [Trait 规范](https://github.com/oam-dev/spec/blob/master/6.traits.md)。

## 参考

- [The Open Application Model specification - github.com](https://github.com/oam-dev/spec)