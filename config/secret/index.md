---
weight: 76
title: Secret 配置
date: '2022-05-21T00:00:00+08:00'
type: book
description: 'Secret 对象用于保存敏感信息，如密码、OAuth 令牌和 SSH 密钥。本文详细介绍了 Secret 的概念、创建方法、使用方式、安全属性以及最佳实践。'
keywords:
- api
- key
- pod
- secret
- spec
- volume
- 使用
- 创建
- 容器
---

Secret 对象类型用来保存敏感信息，例如密码、OAuth 令牌和 SSH 密钥。将这些信息放在 Secret 中比放在 Pod 的定义中或者 Docker 镜像中更加安全和灵活。

## Secret 概览

Secret 是一种包含少量敏感信息例如密码、token 或密钥的对象。这样的信息可能会被放在 Pod spec 中或者镜像中；将其放在一个 Secret 对象中可以更好地控制它的用途，并降低意外暴露的风险。

用户可以创建 Secret，同时系统也会创建一些 Secret。

要使用 Secret，Pod 需要引用 Secret。Pod 可以通过以下方式使用 Secret：

- 作为 [volume](https://kubernetes.io/docs/concepts/storage/volumes) 中的文件被挂载到 Pod 中的一个或者多个容器里
- 当 kubelet 为 Pod 拉取镜像时使用
- 作为环境变量暴露给容器

### 内置 Secret

#### Service Account 使用 API 凭证自动创建和附加 Secret

Kubernetes 自动创建包含访问 API 凭据的 Secret，并自动修改你的 Pod 以使用此类型的 Secret。

如果需要，可以禁用或覆盖自动创建和使用 API 凭据。但是，如果你需要的只是安全地访问 apiserver，我们推荐这样的工作流程。

参阅 Service Account 文档获取关于 Service Account 如何工作的更多信息。

## 创建 Secret

### 使用 kubectl 创建 Secret

假设有些 Pod 需要访问数据库。这些 Pod 需要使用的用户名和密码在你本地机器的 `./username.txt` 和 `./password.txt` 文件里。

```bash
# 创建示例所需的文件
echo -n "admin" > ./username.txt
echo -n "1f2d1e2e67df" > ./password.txt
```

`kubectl create secret` 命令将这些文件打包到一个 Secret 中并在 API server 中创建了一个对象。

```bash
kubectl create secret generic db-user-pass --from-file=./username.txt --from-file=./password.txt
```

你可以这样检查刚创建的 Secret：

```bash
kubectl get secrets
kubectl describe secrets/db-user-pass
```

输出类似于：

```
NAME                  TYPE                                  DATA      AGE
db-user-pass          Opaque                                2         51s

Name:            db-user-pass
Namespace:       default
Labels:          <none>
Annotations:     <none>

Type:            Opaque

Data
====
password.txt:    12 bytes
username.txt:    5 bytes
```

**注意**：默认情况下，`get` 和 `describe` 命令都不会显示文件的内容。这是为了防止将 Secret 中的内容被意外暴露。

### 手动创建 Secret

你也可以先以 JSON 或 YAML 格式在文件中创建一个 Secret 对象，然后创建该对象。

每一项必须是 base64 编码：

```bash
echo -n "admin" | base64
# 输出：YWRtaW4=
echo -n "1f2d1e2e67df" | base64
# 输出：MWYyZDFlMmU2N2Rm

以下是相关的代码示例：

```

现在可以像这样写一个 Secret 对象：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  username: YWRtaW4=
  password: MWYyZDFlMmU2N2Rm
```

使用 `kubectl apply` 创建 Secret：

```bash
kubectl apply -f ./secret.yaml
```

**编码注意事项**：

- Secret 数据的序列化 JSON 和 YAML 值使用 base64 编码成字符串
- 换行符在这些字符串中无效，必须省略
- 在 macOS 上使用 `base64` 实用程序时，用户应避免使用 `-b` 选项来拆分长行
- 对于 Linux 用户，如果 `-w` 选项不可用，应该添加选项 `-w 0` 到 `base64` 命令或使用管道 `base64 | tr -d '\n'`

### 解码 Secret

可以使用 `kubectl get secret` 命令获取 Secret：

```bash
kubectl get secret mysecret -o yaml
```

解码密码字段：

```bash
echo "MWYyZDFlMmU2N2Rm" | base64 --decode
# 输出：1f2d1e2e67df

以下是相关的代码示例：

```

## 使用 Secret

### 在 Pod 中使用 Secret 文件

在 Pod 中的 volume 里使用 Secret：

1. 创建一个 Secret 或者使用已有的 Secret。多个 Pod 可以引用同一个 Secret。
2. 修改你的 Pod 的定义在 `spec.volumes[]` 下增加一个 volume。可以给这个 volume 随意命名，它的 `spec.volumes[].secret.secretName` 必须等于 Secret 对象的名字。
3. 将 `spec.containers[].volumeMounts[]` 加到需要用到该 Secret 的容器中。指定 `spec.containers[].volumeMounts[].readOnly = true` 和 `spec.containers[].volumeMounts[].mountPath` 为你想要该 Secret 出现的尚未使用的目录。
4. 修改你的镜像并且／或者命令行让程序从该目录下寻找文件。Secret 的 `data` 映射中的每一个键都成为了 `mountPath` 下的一个文件名。

这是一个在 Pod 中使用 volume 挂载 Secret 的例子：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: mypod
    image: redis
    volumeMounts:
    - name: foo
      mountPath: "/etc/foo"
      readOnly: true
  volumes:
  - name: foo
    secret:
      secretName: mysecret
```

#### 向特定路径映射 Secret 密钥

我们还可以控制 Secret key 映射在 volume 中的路径。你可以使用 `spec.volumes[].secret.items` 字段修改每个 key 的目标路径：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: mypod
    image: redis
    volumeMounts:
    - name: foo
      mountPath: "/etc/foo"
      readOnly: true
  volumes:
  - name: foo
    secret:
      secretName: mysecret
      items:
      - key: username
        path: my-group/my-username
```

将会发生什么呢：

- `username` Secret 存储在 `/etc/foo/my-group/my-username` 文件中而不是 `/etc/foo/username` 中
- `password` Secret 没有被映射

如果使用了 `spec.volumes[].secret.items`，只有在 `items` 中指定的 key 被映射。要使用 Secret 中所有的 key，所有这些都必须列在 `items` 字段中。

#### Secret 文件权限

你还可以指定 Secret 将拥有的权限模式位文件。如果不指定，默认使用 `0644`。你可以为整个 Secret volume 指定默认模式，如果需要，可以覆盖每个密钥。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: mypod
    image: redis
    volumeMounts:
    - name: foo
      mountPath: "/etc/foo"
  volumes:
  - name: foo
    secret:
      secretName: mysecret
      defaultMode: 0400
```

然后，Secret 将被挂载到 `/etc/foo` 目录，所有通过该 Secret volume 挂载创建的文件的权限都是 `0400`。

你还可以使用映射，并为不同的文件指定不同的权限：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mypod
spec:
  containers:
  - name: mypod
    image: redis
    volumeMounts:
    - name: foo
      mountPath: "/etc/foo"
  volumes:
  - name: foo
    secret:
      secretName: mysecret
      items:
      - key: username
        path: my-group/my-username
        mode: 0777
```

#### 从 Volume 中消费 Secret 值

在挂载的 Secret volume 的容器内，Secret key 将作为文件，并且 Secret 的值使用 base64 解码并存储在这些文件中。这是在上面的示例容器内执行的命令的结果：

```bash
ls /etc/foo/
# 输出：username password
cat /etc/foo/username
# 输出：admin
cat /etc/foo/password
# 输出：1f2d1e2e67df

以下是相关的代码示例：

```

#### 挂载的 Secret 被自动更新

当已经在 volume 中被消费的 Secret 被更新时，被映射的 key 也将被更新。

Kubelet 在周期性同步时检查被挂载的 Secret 是不是最新的。但是，它正在使用其基于本地 TTL 的缓存来获取当前的 Secret 值。结果是，当 Secret 被更新的时刻到将新的 Secret 映射到 Pod 的时刻的总延迟可以与 kubelet 中的 Secret 缓存的 kubelet sync period + TTL 一样长。

### Secret 作为环境变量

将 Secret 作为 Pod 中的环境变量使用：

1. 创建一个 Secret 或者使用一个已存在的 Secret。多个 Pod 可以引用同一个 Secret。
2. 在每个容器中修改你想要使用 Secret key 的 Pod 定义，为要使用的每个 Secret key 添加一个环境变量。消费 Secret key 的环境变量应填充 Secret 的名称，并键入 `env[x].valueFrom.secretKeyRef`。
3. 修改镜像并／或者命令行，以便程序在指定的环境变量中查找值。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-env-pod
spec:
  containers:
  - name: mycontainer
    image: redis
    env:
      - name: SECRET_USERNAME
        valueFrom:
          secretKeyRef:
            name: mysecret
            key: username
      - name: SECRET_PASSWORD
        valueFrom:
          secretKeyRef:
            name: mysecret
            key: password
  restartPolicy: Never
```

#### 消费环境变量里的 Secret 值

在一个消费环境变量 Secret 的容器中，Secret key 作为包含 Secret 数据的 base64 解码值的常规环境变量。这是从上面的示例在容器内执行的命令的结果：

```bash
echo $SECRET_USERNAME
# 输出：admin
echo $SECRET_PASSWORD
# 输出：1f2d1e2e67df

以下是相关的代码示例：

```

### 使用 imagePullSecret

imagePullSecret 是将包含 Docker（或其他）镜像注册表密码的 Secret 传递给 Kubelet 的一种方式，因此可以代表你的 Pod 拉取私有镜像。

#### 手动指定 imagePullSecret

imagePullSecret 的使用在 [镜像文档](https://kubernetes.io/docs/concepts/containers/images/#specifying-imagepullsecrets-on-a-pod) 中说明。

#### 自动附加 imagePullSecrets

你可以手动创建 imagePullSecret，并从 ServiceAccount 引用它。使用该 ServiceAccount 创建的任何 Pod 和默认使用该 ServiceAccount 的 Pod 将会将其的 imagePullSecret 字段设置为服务帐户的 imagePullSecret 字段。有关该过程的详细说明，请参阅 [将 ImagePullSecrets 添加到服务帐户](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/#adding-imagepullsecrets-to-a-service-account)。

## 限制与约束

### 基本限制

- Secret API 对象驻留在命名空间中。它们只能由同一命名空间中的 Pod 引用
- 每个 Secret 的大小限制为 1MB。这是为了防止创建非常大的 Secret 会耗尽 apiserver 和 kubelet 的内存
- Kubelet 仅支持从 API server 获取的 Pod 使用 Secret
- 必须先创建 Secret，除非将它们标记为可选项，否则必须在将其作为环境变量在 Pod 中使用之前创建 Secret

### 环境变量限制

用于通过 `envFrom` 填充环境变量的 Secret，这些环境变量具有被认为是无效环境变量名称的 key 将跳过这些键。该 Pod 将被允许启动。将会有一个事件，其原因是 `InvalidVariableNames`。

### Secret 与 Pod 生命周期的关系

通过 API 创建的 Pod 时，不会检查引用的 Secret 是否存在。一旦 Pod 被调度，kubelet 就会尝试获取该 Secret 的值。如果获取不到该 Secret，或者暂时无法与 API server 建立连接，kubelet 将会定期重试。

## 使用案例

### 使用案例：包含 SSH 密钥的 Pod

创建一个包含 SSH 密钥的 Secret：

```bash
kubectl create secret generic ssh-key-secret \
  --from-file=ssh-privatekey=/path/to/.ssh/id_rsa \
  --from-file=ssh-publickey=/path/to/.ssh/id_rsa.pub
```

**安全性注意事项**：发送自己的 SSH 密钥之前要仔细思考：集群的其他用户可能有权访问该密钥。

现在我们可以创建一个使用 SSH 密钥引用 Secret 的 Pod，并在一个卷中使用它：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-test-pod
  labels:
    name: secret-test
spec:
  volumes:
  - name: secret-volume
    secret:
      secretName: ssh-key-secret
  containers:
  - name: ssh-test-container
    image: mySshImage
    volumeMounts:
    - name: secret-volume
      readOnly: true
      mountPath: "/etc/secret-volume"
```

当容器中的命令运行时，密钥的内容将可在以下目录：

```
/etc/secret-volume/ssh-publickey
/etc/secret-volume/ssh-privatekey
```

### 使用案例：包含数据库凭据的 Pod

创建不同环境的数据库凭据 Secret：

```bash
kubectl create secret generic prod-db-secret \
  --from-literal=username=produser \
  --from-literal=password=Y4nys7f11

kubectl create secret generic test-db-secret \
  --from-literal=username=testuser \
  --from-literal=password=iluvtests
```

创建使用不同 Secret 的 Pod：

```yaml
apiVersion: v1
kind: List
items:
- kind: Pod
  apiVersion: v1
  metadata:
    name: prod-db-client-pod
    labels:
      name: prod-db-client
  spec:
    volumes:
    - name: secret-volume
      secret:
        secretName: prod-db-secret
    containers:
    - name: db-client-container
      image: myClientImage
      volumeMounts:
      - name: secret-volume
        readOnly: true
        mountPath: "/etc/secret-volume"
- kind: Pod
  apiVersion: v1
  metadata:
    name: test-db-client-pod
    labels:
      name: test-db-client
  spec:
    volumes:
    - name: secret-volume
      secret:
        secretName: test-db-secret
    containers:
    - name: db-client-container
      image: myClientImage
      volumeMounts:
      - name: secret-volume
        readOnly: true
        mountPath: "/etc/secret-volume"
```

### 使用案例：Secret 卷中以点号开头的文件

为了将数据"隐藏"起来（即文件名以点号开头的文件），让该键以一个点开始：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: dotfile-secret
data:
  .secret-file: dmFsdWUtMg0KDQo=
---
apiVersion: v1
kind: Pod
metadata:
  name: secret-dotfiles-pod
spec:
  volumes:
  - name: secret-volume
    secret:
      secretName: dotfile-secret
  containers:
  - name: dotfile-test-container
    image: busybox
    command:
    - ls
    - "-la"
    - "/etc/secret-volume"
    volumeMounts:
    - name: secret-volume
      readOnly: true
      mountPath: "/etc/secret-volume"
```

**注意**：以点号开头的文件在 `ls -l` 的输出中被隐藏起来了；必须使用 `ls -la` 才能查看它们。

## 最佳实践

### 客户端使用 Secret API

当部署与 Secret API 交互的应用程序时，应使用诸如 RBAC 之类的授权策略来限制访问。

由于不同 Secret 的重要性不尽相同，建议：

- 在命名空间中 `watch` 和 `list` Secret 的请求是非常强大的功能，应该避免这样的行为
- 需要访问 Secret API 的应用程序应该根据他们需要的 Secret 执行 `get` 请求
- 管理员应该限制对所有 Secret 的访问，同时设置白名单访问应用程序需要的各个实例

### 性能优化

为了提高循环获取的性能，客户端可以设计引用 Secret 的资源，然后 `watch` 资源，在引用更改时重新请求 Secret。

## 安全属性

### 保护机制

- Secret 对象可以独立于使用它们的 Pod 而创建，所以在创建、查看和编辑 Pod 的流程中 Secret 被暴露的风险较小
- 只有当节点上的 Pod 需要用到该 Secret 时，该 Secret 才会被发送到该节点上
- Secret 不会被写入磁盘，而是存储在 tmpfs 中
- 一旦依赖于它的 Pod 被删除，它就被删除
- 在大多数 Kubernetes 发行版中，用户与 API server 之间的通信以及从 API server 到 kubelet 的通信都受到 TLS 的保护
- 同一节点上的多个 Pod 可能拥有多个 Secret，但是只有 Pod 请求的 Secret 在其容器中才是可见的

### 安全风险

- **etcd 存储风险**：API server 的 Secret 数据以明文方式存储在 etcd 中，管理员应该限制对 etcd 的访问
- **文件共享风险**：如果你将 Secret 数据编码为 base64 的清单文件，共享该文件或将其检入代码库，该密码将会被泄露
- **应用程序责任**：应用程序在从卷中读取 Secret 后仍然需要保护 Secret 的值
- **权限泄露**：可以创建和使用 Secret 的 Pod 的用户也可以看到该 Secret 的值
- **节点访问**：目前，任何节点的 root 用户都可以通过模拟 kubelet 来读取 API server 中的任何 Secret

### 安全建议

1. 使用 RBAC 限制对 Secret 的访问
2. 启用 etcd 的静态加密
3. 定期轮换 Secret 中的凭据
4. 避免在日志中记录 Secret 内容
5. 使用专门的密钥管理系统存储高敏感度的机密信息
6. 监控对 Secret 的访 question
