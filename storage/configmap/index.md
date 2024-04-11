---
weight: 56
title: ConfigMap
date: '2022-05-21T00:00:00+08:00'
type: book
---

其实 ConfigMap 功能在 Kubernetes1.2 版本的时候就有了，许多应用程序会从配置文件、命令行参数或环境变量中读取配置信息。这些配置信息需要与 docker image 解耦，你总不能每修改一个配置就重做一个 image 吧？ConfigMap API 给我们提供了向容器中注入配置信息的机制，ConfigMap 可以被用来保存单个属性，也可以用来保存整个配置文件或者 JSON 二进制大对象。

## ConfigMap 概览

**ConfigMap API** 资源用来保存 **key-value pair** 配置数据，这个数据可以在 **pods** 里使用，或者被用来为像 **controller** 一样的系统组件存储配置数据。虽然 ConfigMap 跟 [Secrets](https://kubernetes.io/docs/user-guide/secrets/) 类似，但是 ConfigMap 更方便的处理不含敏感信息的字符串。注意：ConfigMaps 不是属性配置文件的替代品。ConfigMaps 只是作为多个 properties 文件的引用。你可以把它理解为 Linux 系统中的 `/etc` 目录，专门用来存储配置文件的目录。下面举个例子，使用 ConfigMap 配置来创建 Kubernetes Volumes，ConfigMap 中的每个 data 项都会成为一个新文件。

```yaml
kind: ConfigMap
apiVersion: v1
metadata:
  creationTimestamp: 2016-02-18T19:14:38Z
  name: example-config
  namespace: default
data:
  example.property.1: hello
  example.property.2: world
  example.property.file: |-
    property.1=value-1
    property.2=value-2
    property.3=value-3
```

`data` 一栏包括了配置数据，ConfigMap 可以被用来保存单个属性，也可以用来保存一个配置文件。配置数据可以通过很多种方式在 Pods 里被使用。ConfigMaps 可以被用来：

1. 设置环境变量的值
2. 在容器里设置命令行参数
3. 在数据卷里面创建 config 文件

用户和系统组件两者都可以在 ConfigMap 里面存储配置数据。

其实不用看下面的文章，直接从 `kubectl create configmap -h` 的帮助信息中就可以对 ConfigMap 究竟如何创建略知一二了。

```
Examples:
  # Create a new configmap named my-config based on folder bar
  kubectl create configmap my-config --from-file=path/to/bar

  # Create a new configmap named my-config with specified keys instead of file basenames on disk
  kubectl create configmap my-config --from-file=key1=/path/to/bar/file1.txt --from-file=key2=/path/to/bar/file2.txt

  # Create a new configmap named my-config with key1=config1 and key2=config2
  kubectl create configmap my-config --from-literal=key1=config1 --from-literal=key2=config2
```

## 创建 ConfigMaps

可以使用该命令，用给定值、文件或目录来创建 ConfigMap。

```
kubectl create configmap
```

### 使用目录创建

比如我们已经有了一些配置文件，其中包含了我们想要设置的 ConfigMap 的值：

```bash
$ ls docs/user-guide/configmap/kubectl/
game.properties
ui.properties

$ cat docs/user-guide/configmap/kubectl/game.properties
enemies=aliens
lives=3
enemies.cheat=true
enemies.cheat.level=noGoodRotten
secret.code.passphrase=UUDDLRLRBABAS
secret.code.allowed=true
secret.code.lives=30

$ cat docs/user-guide/configmap/kubectl/ui.properties
color.good=purple
color.bad=yellow
allow.textmode=true
how.nice.to.look=fairlyNice
```

使用下面的命令可以创建一个包含目录中所有文件的 ConfigMap。

```bash
$ kubectl create configmap game-config --from-file=docs/user-guide/configmap/kubectl
```

`—from-file` 指定在目录下的所有文件都会被用在 ConfigMap 里面创建一个键值对，键的名字就是文件名，值就是文件的内容。

让我们来看一下这个命令创建的 ConfigMap：

```yaml
$ kubectl describe configmaps game-config
Name:           game-config
Namespace:      default
Labels:         <none>
Annotations:    <none>

Data
====
game.properties:        158 bytes
ui.properties:          83 bytes
```

我们可以看到那两个 key 是从 kubectl 指定的目录中的文件名。这些 key 的内容可能会很大，所以在 kubectl describe 的输出中，只能够看到键的名字和他们的大小。如果想要看到键的值的话，可以使用 `kubectl get`：

```bash
$ kubectl get configmaps game-config -o yaml
```

我们以 `yaml` 格式输出配置。

```yaml
apiVersion: v1
data:
  game.properties: |
    enemies=aliens
    lives=3
    enemies.cheat=true
    enemies.cheat.level=noGoodRotten
    secret.code.passphrase=UUDDLRLRBABAS
    secret.code.allowed=true
    secret.code.lives=30
  ui.properties: |
    color.good=purple
    color.bad=yellow
    allow.textmode=true
    how.nice.to.look=fairlyNice
kind: ConfigMap
metadata:
  creationTimestamp: 2016-02-18T18:34:05Z
  name: game-config
  namespace: default
  resourceVersion: "407"
  selfLink: /api/v1/namespaces/default/configmaps/game-config
  uid: 30944725-d66e-11e5-8cd0-68f728db1985
```

### 使用文件创建

刚才**使用目录创建**的时候我们 `—from-file` 指定的是一个目录，只要指定为一个文件就可以从单个文件中创建 ConfigMap。

```bash
$ kubectl create configmap game-config-2 --from-file=docs/user-guide/configmap/kubectl/game.properties 

$ kubectl get configmaps game-config-2 -o yaml
apiVersion: v1
data:
  game-special-key: |
    enemies=aliens
    lives=3
    enemies.cheat=true
    enemies.cheat.level=noGoodRotten
    secret.code.passphrase=UUDDLRLRBABAS
    secret.code.allowed=true
    secret.code.lives=30
kind: ConfigMap
metadata:
  creationTimestamp: 2016-02-18T18:54:22Z
  name: game-config-3
  namespace: default
  resourceVersion: "530"
  selfLink: /api/v1/namespaces/default/configmaps/game-config-3
  uid: 05f8da22-d671-11e5-8cd0-68f728db1985
```

`—from-file` 这个参数可以使用多次，你可以使用两次分别指定上个实例中的那两个配置文件，效果就跟指定整个目录是一样的。

### 使用字面值创建

使用文字值创建，利用 `—from-literal` 参数传递配置信息，该参数可以使用多次，格式如下；

```bash
$ kubectl create configmap special-config --from-literal=special.how=very --from-literal=special.type=charm

$ kubectl get configmaps special-config -o yaml
apiVersion: v1
data:
  special.how: very
  special.type: charm
kind: ConfigMap
metadata:
  creationTimestamp: 2016-02-18T19:14:38Z
  name: special-config
  namespace: default
  resourceVersion: "651"
  selfLink: /api/v1/namespaces/default/configmaps/special-config
  uid: dadce046-d673-11e5-8cd0-68f728db1985
```

## Pod 中使用 ConfigMap

**使用 ConfigMap 来替代环境变量**

ConfigMap 可以被用来填入环境变量。看下下面的 ConfigMap。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: special-config
  namespace: default
data:
  special.how: very
  special.type: charm
apiVersion: v1
kind: ConfigMap
metadata:
  name: env-config
  namespace: default
data:
  log_level: INFO
```

我们可以在 Pod 中这样使用 ConfigMap：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: gcr.io/google_containers/busybox
      command: [ "/bin/sh", "-c", "env" ]
      env:
        - name: SPECIAL_LEVEL_KEY
          valueFrom:
            configMapKeyRef:
              name: special-config
              key: special.how
        - name: SPECIAL_TYPE_KEY
          valueFrom:
            configMapKeyRef:
              name: special-config
              key: special.type
      envFrom:
        - configMapRef:
            name: env-config
  restartPolicy: Never
```

这个 Pod 运行后会输出如下几行：

```
SPECIAL_LEVEL_KEY=very
SPECIAL_TYPE_KEY=charm
log_level=INFO
```

**用 ConfigMap 设置命令行参数**

ConfigMap 也可以被使用来设置容器中的命令或者参数值。它使用的是 Kubernetes 的 $(VAR_NAME) 替换语法。我们看下下面这个 ConfigMap。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: special-config
  namespace: default
data:
  special.how: very
  special.type: charm
```

为了将 ConfigMap 中的值注入到命令行的参数里面，我们还要像前面那个例子一样使用环境变量替换语法 `${VAR_NAME)`。（其实这个东西就是给 Docker 容器设置环境变量，以前我创建镜像的时候经常这么玩，通过 docker run 的时候指定 - e 参数修改镜像里的环境变量，然后 docker 的 CMD 命令再利用该 $(VAR_NAME) 通过 sed 来修改配置文件或者作为命令行启动参数。）

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: gcr.io/google_containers/busybox
      command: [ "/bin/sh", "-c", "echo $(SPECIAL_LEVEL_KEY) $(SPECIAL_TYPE_KEY)" ]
      env:
        - name: SPECIAL_LEVEL_KEY
          valueFrom:
            configMapKeyRef:
              name: special-config
              key: special.how
        - name: SPECIAL_TYPE_KEY
          valueFrom:
            configMapKeyRef:
              name: special-config
              key: special.type
  restartPolicy: Never
```

运行这个 Pod 后会输出：

```
very charm
```

**通过数据卷插件使用 ConfigMap**

ConfigMap 也可以在数据卷里面被使用。还是这个 ConfigMap。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: special-config
  namespace: default
data:
  special.how: very
  special.type: charm
```

在数据卷里面使用这个 ConfigMap，有不同的选项。最基本的就是将文件填入数据卷，在这个文件中，键就是文件名，键值就是文件内容：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: gcr.io/google_containers/busybox
      command: [ "/bin/sh", "-c", "cat /etc/config/special.how" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
  volumes:
    - name: config-volume
      configMap:
        name: special-config
  restartPolicy: Never
```

运行这个 Pod 的输出是 `very`。

我们也可以在 ConfigMap 值被映射的数据卷里控制路径。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: gcr.io/google_containers/busybox
      command: [ "/bin/sh","-c","cat /etc/config/path/to/special-key" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
  volumes:
    - name: config-volume
      configMap:
        name: special-config
        items:
        - key: special.how
          path: path/to/special-key
  restartPolicy: Never
```

运行这个 Pod 后的结果是 `very`。
