# Annotation

Annotation，顾名思义，就是注解。Annotation可以将Kubernetes资源对象关联到任意的非标识性元数据。使用客户端（如工具和库）可以检索到这些元数据。

## 关联元数据到对象

Label和Annotation都可以将元数据关联到Kubernetes资源对象。Label主要用于选择对象，可以挑选出满足特定条件的对象。相比之下，annotation 不能用于标识及选择对象。annotation中的元数据可多可少，可以是结构化的或非结构化的，也可以包含label中不允许出现的字符。

annotation和label一样都是key/value键值对映射结构：

```json
"annotations": {
  "key1" : "value1",
  "key2" : "value2"
}
```

以下列出了一些可以记录在 annotation 中的对象信息：

- 声明配置层管理的字段。使用annotation关联这类字段可以用于区分以下几种配置来源：客户端或服务器设置的默认值，自动生成的字段或自动生成的 auto-scaling 和 auto-sizing 系统配置的字段。
- 创建信息、版本信息或镜像信息。例如时间戳、版本号、git分支、PR序号、镜像哈希值以及仓库地址。
- 记录日志、监控、分析或审计存储仓库的指针


- 可以用于debug的客户端（库或工具）信息，例如名称、版本和创建信息。
- 用户信息，以及工具或系统来源信息、例如来自非Kubernetes生态的相关对象的URL信息。
- 轻量级部署工具元数据，例如配置或检查点。
- 负责人的电话或联系方式，或能找到相关信息的目录条目信息，例如团队网站。

如果不使用annotation，您也可以将以上类型的信息存放在外部数据库或目录中，但这样做不利于创建用于部署、管理、内部检查的共享工具和客户端库。

## 示例

如 Istio 的 Deployment 配置中就使用到了 annotation：

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: istio-manager
spec:
  replicas: 1
  template:
    metadata:
      annotations:
        alpha.istio.io/sidecar: ignore
      labels:
        istio: manager
    spec:
      serviceAccountName: istio-manager-service-account
      containers:
      - name: discovery
        image: harbor-001.jimmysong.io/library/manager:0.1.5
        imagePullPolicy: Always
        args: ["discovery", "-v", "2"]
        ports:
        - containerPort: 8080
        env:
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: metadata.namespace
      - name: apiserver
        image: harbor-001.jimmysong.io/library/manager:0.1.5
        imagePullPolicy: Always
        args: ["apiserver", "-v", "2"]
        ports:
        - containerPort: 8081
        env:
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              apiVersion: v1
              fieldPath: metadata.namespace
```

`alpha.istio.io/sidecar` 注解就是用来控制是否自动向 pod 中注入 sidecar 的。
