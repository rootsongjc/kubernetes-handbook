# Traefik Ingress Controller

我们在前面部署了 [Traefik](https://traefik.io) 作为Ingress Controller，如果集群外部直接访问Kubenretes内部服务的话，可以直接创建Ingress如下所示：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: traefik-ingress
  namespace: default
spec:
  rules:
  - host: traefik.nginx.io
    http:
      paths:
      - path: /
        backend:
          serviceName: my-nginx
          servicePort: 80
```

## Traefik Ingress Controller

当我们处于迁移应用到kuberentes上的阶段时，可能有部分服务实例不在kubernetes上，服务的路由使用nginx配置，这时处于nginx和ingress共存的状态。参考下面的配置：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: td-ingress
  namespace: default
  annotations:
    traefik.frontend.rule.type: PathPrefixStrip
    kubernetes.io/ingress.class: traefik
spec:
  rules:
  - host: "*.jimmysong.io"
    http:
      paths:
      - path: /docGenerate
        backend:
          serviceName: td-sdmk-docgenerate
          servicePort: 80
```

注意**annotation**的配置：

- `traefik.frontend.rule.type: PathPrefixStrip`：表示将截掉URL中的`path`
- `kubernetes.io/ingress.class`：表示使用的ingress类型

在nginx中增加配置：

```ini
upstream docGenerate {
       server 172.20.0.119:80;
       keepalive 200;
    }
```

172.20.0.119是我们的边缘节点的VIP，见[边缘节点配置](../practice/edge-node-configuration.md)。

## 参考

- [Kubernetes Ingress Backend - traefik.io](https://docs.traefik.io/configuration/backends/kubernetes/)
- [Kubernetes Ingress Controller - traefik.io](http://docs.traefik.io/user-guide/kubernetes/)
