# RBAC——基于角色的访问控制

以下内容是 [xingzhou](https://github.com/xingzhou) 对 kubernetes 官方文档的翻译，原文地址 https://k8smeetup.github.io/docs/admin/authorization/rbac/

基于角色的访问控制（Role-Based Access Control, 即”RBAC”）使用”rbac.authorization.k8s.io” API Group实现授权决策，允许管理员通过Kubernetes API动态配置策略。

截至Kubernetes 1.6，RBAC模式处于beta版本。

要启用RBAC，请使用`--authorization-mode=RBAC`启动API Server。

## API概述

本节将介绍RBAC API所定义的四种顶级类型。用户可以像使用其他Kubernetes API资源一样 （例如通过`kubectl`、API调用等）与这些资源进行交互。例如，命令`kubectl create -f (resource).yml` 可以被用于以下所有的例子，当然，读者在尝试前可能需要先阅读以下相关章节的内容。

### Role与ClusterRole

在RBAC API中，一个角色包含了一套表示一组权限的规则。 权限以纯粹的累加形式累积（没有”否定”的规则）。 角色可以由命名空间（namespace）内的`Role`对象定义，而整个Kubernetes集群范围内有效的角色则通过`ClusterRole`对象实现。

一个`Role`对象只能用于授予对某一单一命名空间中资源的访问权限。 以下示例描述了”default”命名空间中的一个`Role`对象的定义，用于授予对pod的读访问权限：

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""] # 空字符串""表明使用core API group
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

`ClusterRole`对象可以授予与`Role`对象相同的权限，但由于它们属于集群范围对象， 也可以使用它们授予对以下几种资源的访问权限：

- 集群范围资源（例如节点，即node）
- 非资源类型endpoint（例如”/healthz”）
- 跨所有命名空间的命名空间范围资源（例如pod，需要运行命令`kubectl get pods --all-namespaces`来查询集群中所有的pod）

下面示例中的`ClusterRole`定义可用于授予用户对某一特定命名空间，或者所有命名空间中的secret（取决于其[绑定](https://k8smeetup.github.io/docs/admin/authorization/rbac/#rolebinding-and-clusterrolebinding)方式）的读访问权限：

```yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  # 鉴于ClusterRole是集群范围对象，所以这里不需要定义"namespace"字段
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "watch", "list"]
```

### RoleBinding与ClusterRoleBinding

角色绑定将一个角色中定义的各种权限授予一个或者一组用户。 角色绑定包含了一组相关主体（即subject, 包括用户——User、用户组——Group、或者服务账户——Service Account）以及对被授予角色的引用。 在命名空间中可以通过`RoleBinding`对象授予权限，而集群范围的权限授予则通过`ClusterRoleBinding`对象完成。

`RoleBinding`可以引用在同一命名空间内定义的`Role`对象。 下面示例中定义的`RoleBinding`对象在”default”命名空间中将”pod-reader”角色授予用户”jane”。 这一授权将允许用户”jane”从”default”命名空间中读取pod。

```yaml
# 以下角色绑定定义将允许用户"jane"从"default"命名空间中读取pod。
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

`RoleBinding`对象也可以引用一个`ClusterRole`对象用于在`RoleBinding`所在的命名空间内授予用户对所引用的`ClusterRole`中 定义的命名空间资源的访问权限。这一点允许管理员在整个集群范围内首先定义一组通用的角色，然后再在不同的命名空间中复用这些角色。

例如，尽管下面示例中的`RoleBinding`引用的是一个`ClusterRole`对象，但是用户”dave”（即角色绑定主体）还是只能读取”development” 命名空间中的secret（即`RoleBinding`所在的命名空间）。

```yaml
# 以下角色绑定允许用户"dave"读取"development"命名空间中的secret。
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: read-secrets
  namespace: development # 这里表明仅授权读取"development"命名空间中的资源。
subjects:
- kind: User
  name: dave
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

最后，可以使用`ClusterRoleBinding`在集群级别和所有命名空间中授予权限。下面示例中所定义的`ClusterRoleBinding` 允许在用户组”manager”中的任何用户都可以读取集群中任何命名空间中的secret。

```yaml
# 以下`ClusterRoleBinding`对象允许在用户组"manager"中的任何用户都可以读取集群中任何命名空间中的secret。
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: read-secrets-global
subjects:
- kind: Group
  name: manager
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

### 对资源的引用

大多数资源由代表其名字的字符串表示，例如”pods”，就像它们出现在相关API endpoint的URL中一样。然而，有一些Kubernetes API还 包含了”子资源”，比如pod的logs。在Kubernetes中，pod logs endpoint的URL格式为：

```
GET /api/v1/namespaces/{namespace}/pods/{name}/log

```

在这种情况下，”pods”是命名空间资源，而”log”是pods的子资源。为了在RBAC角色中表示出这一点，我们需要使用斜线来划分资源 与子资源。如果需要角色绑定主体读取pods以及pod log，您需要定义以下角色：

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: pod-and-pod-logs-reader
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list"]
```

通过`resourceNames`列表，角色可以针对不同种类的请求根据资源名引用资源实例。当指定了`resourceNames`列表时，不同动作 种类的请求的权限，如使用”get”、”delete”、”update”以及”patch”等动词的请求，将被限定到资源列表中所包含的资源实例上。 例如，如果需要限定一个角色绑定主体只能”get”或者”update”一个configmap时，您可以定义以下角色：

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: configmap-updater
rules:
- apiGroups: [""]
  resources: ["configmap"]
  resourceNames: ["my-configmap"]
  verbs: ["update", "get"]
```

值得注意的是，如果设置了`resourceNames`，则请求所使用的动词不能是list、watch、create或者deletecollection。 由于资源名不会出现在create、list、watch和deletecollection等API请求的URL中，所以这些请求动词不会被设置了`resourceNames` 的规则所允许，因为规则中的`resourceNames`部分不会匹配这些请求。

#### 一些角色定义的例子

在以下示例中，我们仅截取展示了`rules`部分的定义。

允许读取core API Group中定义的资源”pods”：

```yaml
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
```

允许读写在”extensions”和”apps” API Group中定义的”deployments”：

```yaml
rules:
- apiGroups: ["extensions", "apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

允许读取”pods”以及读写”jobs”：

```yaml
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["batch", "extensions"]
  resources: ["jobs"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

允许读取一个名为”my-config”的`ConfigMap`实例（需要将其通过`RoleBinding`绑定从而限制针对某一个命名空间中定义的一个`ConfigMap`实例的访问）：

```yaml
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["my-config"]
  verbs: ["get"]
```

允许读取core API Group中的”nodes”资源（由于`Node`是集群级别资源，所以此`ClusterRole`定义需要与一个`ClusterRoleBinding`绑定才能有效）：

```yaml
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list", "watch"]
```

允许对非资源endpoint “/healthz”及其所有子路径的”GET”和”POST”请求（此`ClusterRole`定义需要与一个`ClusterRoleBinding`绑定才能有效）：

```yaml
rules:
- nonResourceURLs: ["/healthz", "/healthz/*"] # 在非资源URL中，'*'代表后缀通配符
  verbs: ["get", "post"]
```

### 对角色绑定主体（Subject）的引用

`RoleBinding`或者`ClusterRoleBinding`将角色绑定到*角色绑定主体*（Subject）。 角色绑定主体可以是用户组（Group）、用户（User）或者服务账户（Service Accounts）。

用户由字符串表示。可以是纯粹的用户名，例如”alice”、电子邮件风格的名字，如 “bob@example.com” 或者是用字符串表示的数字id。由Kubernetes管理员配置[认证模块](https://k8smeetup.github.io/docs/admin/authentication/) 以产生所需格式的用户名。对于用户名，RBAC授权系统不要求任何特定的格式。然而，前缀`system:`是 为Kubernetes系统使用而保留的，所以管理员应该确保用户名不会意外地包含这个前缀。

Kubernetes中的用户组信息由授权模块提供。用户组与用户一样由字符串表示。Kubernetes对用户组 字符串没有格式要求，但前缀`system:`同样是被系统保留的。

[服务账户](https://k8smeetup.github.io/docs/tasks/configure-pod-container/configure-service-account/)拥有包含 `system:serviceaccount:`前缀的用户名，并属于拥有`system:serviceaccounts:`前缀的用户组。

#### 角色绑定的一些例子

以下示例中，仅截取展示了`RoleBinding`的`subjects`字段。

一个名为”alice@example.com”的用户：

```yaml
subjects:
- kind: User
  name: "alice@example.com"
  apiGroup: rbac.authorization.k8s.io
```

一个名为”frontend-admins”的用户组：

```yaml
subjects:
- kind: Group
  name: "frontend-admins"
  apiGroup: rbac.authorization.k8s.io
```

kube-system命名空间中的默认服务账户：

```yaml
subjects:
- kind: ServiceAccount
  name: default
  namespace: kube-system
```

名为”qa”命名空间中的所有服务账户：

```yaml
subjects:
- kind: Group
  name: system:serviceaccounts:qa
  apiGroup: rbac.authorization.k8s.io
```

在集群中的所有服务账户：

```yaml
subjects:
- kind: Group
  name: system:serviceaccounts
  apiGroup: rbac.authorization.k8s.io
```

所有认证过的用户（version 1.5+）：

```yaml
subjects:
- kind: Group
  name: system:authenticated
  apiGroup: rbac.authorization.k8s.io
```

所有未认证的用户（version 1.5+）：

```yaml
subjects:
- kind: Group
  name: system:unauthenticated
  apiGroup: rbac.authorization.k8s.io
```

所有用户（version 1.5+）：

```yaml
subjects:
- kind: Group
  name: system:authenticated
  apiGroup: rbac.authorization.k8s.io
- kind: Group
  name: system:unauthenticated
  apiGroup: rbac.authorization.k8s.io
```

## 默认角色与默认角色绑定

API Server会创建一组默认的`ClusterRole`和`ClusterRoleBinding`对象。 这些默认对象中有许多包含`system:`前缀，表明这些资源由Kubernetes基础组件”拥有”。 对这些资源的修改可能导致非功能性集群（non-functional cluster）。一个例子是`system:node` ClusterRole对象。 这个角色定义了kubelets的权限。如果这个角色被修改，可能会导致kubelets无法正常工作。

所有默认的ClusterRole和ClusterRoleBinding对象都会被标记为`kubernetes.io/bootstrapping=rbac-defaults`。

### 自动更新

每次启动时，API Server都会更新默认ClusterRole所缺乏的各种权限，并更新默认ClusterRoleBinding所缺乏的各个角色绑定主体。 这种自动更新机制允许集群修复一些意外的修改。由于权限和角色绑定主体在新的Kubernetes释出版本中可能变化，这也能够保证角色和角色 绑定始终保持是最新的。

如果需要禁用自动更新，请将默认ClusterRole以及ClusterRoleBinding的`rbac.authorization.kubernetes.io/autoupdate` 设置成为`false`。 请注意，缺乏默认权限和角色绑定主体可能会导致非功能性集群问题。

自Kubernetes 1.6+起，当集群RBAC授权器（RBAC Authorizer）处于开启状态时，可以启用自动更新功能.

### 发现类角色

| 默认ClusterRole         | 默认ClusterRoleBinding                     | 描述                                       |
| --------------------- | ---------------------------------------- | ---------------------------------------- |
| **system:basic-user** | **system:authenticated** and **system:unauthenticated**groups | 允许用户只读访问有关自己的基本信息。                       |
| **system:discovery**  | **system:authenticated** and **system:unauthenticated**groups | 允许只读访问API discovery endpoints, 用于在API级别进行发现和协商。 |

### 面向用户的角色

一些默认角色并不包含`system:`前缀，它们是面向用户的角色。 这些角色包含超级用户角色（`cluster-admin`），即旨在利用ClusterRoleBinding（`cluster-status`）在集群范围内授权的角色， 以及那些使用RoleBinding（`admin`、`edit`和`view`）在特定命名空间中授权的角色。

| 默认ClusterRole     | 默认ClusterRoleBinding     | 描述                                       |
| ----------------- | ------------------------ | ---------------------------------------- |
| **cluster-admin** | **system:masters** group | 超级用户权限，允许对任何资源执行任何操作。 在**ClusterRoleBinding**中使用时，可以完全控制集群和所有命名空间中的所有资源。 在**RoleBinding**中使用时，可以完全控制RoleBinding所在命名空间中的所有资源，包括命名空间自己。 |
| **admin**         | None                     | 管理员权限，利用**RoleBinding**在某一命名空间内部授予。 在**RoleBinding**中使用时，允许针对命名空间内大部分资源的读写访问， 包括在命名空间内创建角色与角色绑定的能力。 但不允许对资源配额（resource quota）或者命名空间本身的写访问。 |
| **edit**          | None                     | 允许对某一个命名空间内大部分对象的读写访问，但不允许查看或者修改角色或者角色绑定。 |
| **view**          | None                     | 允许对某一个命名空间内大部分对象的只读访问。 不允许查看角色或者角色绑定。 由于可扩散性等原因，不允许查看secret资源。 |

### Core Component Roles

### 核心组件角色

| 默认ClusterRole                      | 默认ClusterRoleBinding                     | 描述                                       |
| ---------------------------------- | ---------------------------------------- | ---------------------------------------- |
| **system:kube-scheduler**          | **system:kube-scheduler** user           | 允许访问kube-scheduler组件所需要的资源。              |
| **system:kube-controller-manager** | **system:kube-controller-manager** user  | 允许访问kube-controller-manager组件所需要的资源。 单个控制循环所需要的权限请参阅[控制器（controller）角色](https://k8smeetup.github.io/docs/admin/authorization/rbac/#controller-roles). |
| **system:node**                    | **system:nodes** group (deprecated in 1.7) | 允许对kubelet组件所需要的资源的访问，**包括读取所有secret和对所有pod的写访问**。 自Kubernetes 1.7开始, 相比较于这个角色，更推荐使用[Node authorizer](https://kubernetes.io/docs/admin/authorization/node/) 以及[NodeRestriction admission plugin](https://kubernetes.io/docs/admin/admission-controllers#NodeRestriction)， 并允许根据调度运行在节点上的pod授予kubelets API访问的权限。 自Kubernetes 1.7开始，当启用`Node`授权模式时，对`system:nodes`用户组的绑定将不会被自动创建。 |
| **system:node-proxier**            | **system:kube-proxy** user               | 允许对kube-proxy组件所需要资源的访问。                 |

### 其它组件角色

| 默认ClusterRole                          | 默认ClusterRoleBinding                                       | 描述                                                         |
| ---------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **system:auth-delegator**                | None                                                         | 允许委托认证和授权检查。 通常由附加API Server用于统一认证和授权。 |
| **system:heapster**                      | None                                                         | [Heapster](https://github.com/kubernetes/heapster)组件的角色。 |
| **system:kube-aggregator**               | None                                                         | [kube-aggregator](https://github.com/kubernetes/kube-aggregator)组件的角色。 |
| **system:kube-dns**                      | **kube-dns** service account in the **kube-system**namespace | [kube-dns](https://k8smeetup.github.io/docs/admin/dns/)组件的角色。 |
| **system:node-bootstrapper**             | None                                                         | 允许对执行[Kubelet TLS引导（Kubelet TLS bootstrapping）](https://k8smeetup.github.io/docs/admin/kubelet-tls-bootstrapping/)所需要资源的访问. |
| **system:node-problem-detector**         | None                                                         | [node-problem-detector](https://github.com/kubernetes/node-problem-detector)组件的角色。 |
| **system:persistent-volume-provisioner** | None                                                         | 允许对大部分动态存储卷创建组件（dynamic volume provisioner）所需要资源的访问。 |

### 控制器（Controller）角色

[Kubernetes controller manager](https://k8smeetup.github.io/docs/admin/kube-controller-manager/)负责运行核心控制循环。 当使用`--use-service-account-credentials`选项运行controller manager时，每个控制循环都将使用单独的服务账户启动。 而每个控制循环都存在对应的角色，前缀名为`system:controller:`。 如果不使用`--use-service-account-credentials`选项时，controller manager将会使用自己的凭证运行所有控制循环，而这些凭证必须被授予相关的角色。 这些角色包括：

- system:controller:attachdetach-controller
- system:controller:certificate-controller
- system:controller:cronjob-controller
- system:controller:daemon-set-controller
- system:controller:deployment-controller
- system:controller:disruption-controller
- system:controller:endpoint-controller
- system:controller:generic-garbage-collector
- system:controller:horizontal-pod-autoscaler
- system:controller:job-controller
- system:controller:namespace-controller
- system:controller:node-controller
- system:controller:persistent-volume-binder
- system:controller:pod-garbage-collector
- system:controller:replicaset-controller
- system:controller:replication-controller
- system:controller:resourcequota-controller
- system:controller:route-controller
- system:controller:service-account-controller
- system:controller:service-controller
- system:controller:statefulset-controller
- system:controller:ttl-controller

## 初始化与预防权限升级

RBAC API会阻止用户通过编辑角色或者角色绑定来升级权限。 由于这一点是在API级别实现的，所以在RBAC授权器（RBAC authorizer）未启用的状态下依然可以正常工作。

用户只有在拥有了角色所包含的所有权限的条件下才能创建／更新一个角色，这些操作还必须在角色所处的相同范围内进行（对于`ClusterRole`来说是集群范围，对于`Role`来说是在与角色相同的命名空间或者集群范围）。 例如，如果用户”user-1”没有权限读取集群范围内的secret列表，那么他也不能创建包含这种权限的`ClusterRole`。为了能够让用户创建／更新角色，需要：

1. 授予用户一个角色以允许他们根据需要创建／更新`Role`或者`ClusterRole`对象。
2. 授予用户一个角色包含他们在`Role`或者`ClusterRole`中所能够设置的所有权限。如果用户尝试创建或者修改`Role`或者`ClusterRole`以设置那些他们未被授权的权限时，这些API请求将被禁止。

用户只有在拥有所引用的角色中包含的所有权限时才可以创建／更新角色绑定（这些操作也必须在角色绑定所处的相同范围内进行）*或者*用户被明确授权可以在所引用的角色上执行绑定操作。 例如，如果用户”user-1”没有权限读取集群范围内的secret列表，那么他将不能创建`ClusterRole`来引用那些授予了此项权限的角色。为了能够让用户创建／更新角色绑定，需要：

1. 授予用户一个角色以允许他们根据需要创建／更新`RoleBinding`或者`ClusterRoleBinding`对象。
2. 授予用户绑定某一特定角色所需要的权限：
   - 隐式地，通过授予用户所有所引用的角色中所包含的权限
   - 显式地，通过授予用户在特定Role（或者ClusterRole）对象上执行`bind`操作的权限

例如，下面例子中的ClusterRole和RoleBinding将允许用户”user-1”授予其它用户”user-1-namespace”命名空间内的`admin`、`edit`和`view`等角色和角色绑定。

```yaml
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRole
metadata:
  name: role-grantor
rules:
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["rolebindings"]
  verbs: ["create"]
- apiGroups: ["rbac.authorization.k8s.io"]
  resources: ["clusterroles"]
  verbs: ["bind"]
  resourceNames: ["admin","edit","view"]
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: RoleBinding
metadata:
  name: role-grantor-binding
  namespace: user-1-namespace
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: role-grantor
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: User
  name: user-1
```

当初始化第一个角色和角色绑定时，初始用户需要能够授予他们尚未拥有的权限。 初始化初始角色和角色绑定时需要：

- 使用包含`system：masters`用户组的凭证，该用户组通过默认绑定绑定到`cluster-admin`超级用户角色。
- 如果您的API Server在运行时启用了非安全端口（`--insecure-port`），您也可以通过这个没有施行认证或者授权的端口发送角色或者角色绑定请求。

## 一些命令行工具

有两个`kubectl`命令可以用于在命名空间内或者整个集群内授予角色。

### `kubectl create rolebinding`

在某一特定命名空间内授予`Role`或者`ClusterRole`。示例如下：

- 在名为”acme”的命名空间中将`admin` `ClusterRole`授予用户”bob”：

  `kubectl create rolebinding bob-admin-binding --clusterrole=admin --user=bob --namespace=acme`

- 在名为”acme”的命名空间中将`view` `ClusterRole`授予服务账户”myapp”：

  `kubectl create rolebinding myapp-view-binding --clusterrole=view --serviceaccount=acme:myapp --namespace=acme`

### `kubectl create clusterrolebinding`

在整个集群中授予`ClusterRole`，包括所有命名空间。示例如下：

- 在整个集群范围内将`cluster-admin` `ClusterRole`授予用户”root”：

  `kubectl create clusterrolebinding root-cluster-admin-binding --clusterrole=cluster-admin --user=root`

- 在整个集群范围内将`system:node` `ClusterRole`授予用户”kubelet”：

  `kubectl create clusterrolebinding kubelet-node-binding --clusterrole=system:node --user=kubelet`

- 在整个集群范围内将`view` `ClusterRole`授予命名空间”acme”内的服务账户”myapp”：

  `kubectl create clusterrolebinding myapp-view-binding --clusterrole=view --serviceaccount=acme:myapp`

请参阅CLI帮助文档以获得上述命令的详细用法

## 服务账户（Service Account）权限

默认的RBAC策略将授予控制平面组件（control-plane component）、节点（node）和控制器（controller）一组范围受限的权限， 但对于”kube-system”命名空间以外的服务账户，则*不授予任何权限*（超出授予所有认证用户的发现权限）。

这一点允许您根据需要向特定服务账号授予特定权限。 细粒度的角色绑定将提供更好的安全性，但需要更多精力管理。 更粗粒度的授权可能授予服务账号不需要的API访问权限（甚至导致潜在授权扩散），但更易于管理。

从最安全到最不安全可以排序以下方法：

1. 对某一特定应用程序的服务账户授予角色（最佳实践）

   要求应用程序在其pod规范（pod spec）中指定`serviceAccountName`字段，并且要创建相应服务账户（例如通过API、应用程序清单或者命令`kubectl create serviceaccount`等）。

   例如，在”my-namespace”命名空间中授予服务账户”my-sa”只读权限：

   ```bash
   kubectl create rolebinding my-sa-view \
     --clusterrole=view \
     --serviceaccount=my-namespace:my-sa \
     --namespace=my-namespace
   ```

2. 在某一命名空间中授予”default”服务账号一个角色

   如果一个应用程序没有在其pod规范中指定`serviceAccountName`，它将默认使用”default”服务账号。

   注意：授予”default”服务账号的权限将可用于命名空间内任何没有指定`serviceAccountName`的pod。

   下面的例子将在”my-namespace”命名空间内授予”default”服务账号只读权限：

   ```bash
   kubectl create rolebinding default-view \
     --clusterrole=view \
     --serviceaccount=my-namespace:default \
     --namespace=my-namespace
   ```

   目前，许多[加载项（addon）](https://kubernetes.io/docs/concepts/cluster-administration/addons/)作为”kube-system”命名空间中的”default”服务帐户运行。 要允许这些加载项使用超级用户访问权限，请将cluster-admin权限授予”kube-system”命名空间中的”default”服务帐户。 注意：启用上述操作意味着”kube-system”命名空间将包含允许超级用户访问API的秘钥。

   ```bash
   kubectl create clusterrolebinding add-on-cluster-admin \
     --clusterrole=cluster-admin \
     --serviceaccount=kube-system:default
   ```

3. 为命名空间中所有的服务账号授予角色

   如果您希望命名空间内的所有应用程序都拥有同一个角色，无论它们使用什么服务账户，您可以为该命名空间的服务账户用户组授予角色。

   下面的例子将授予”my-namespace”命名空间中的所有服务账户只读权限：

   ```bash
   kubectl create rolebinding serviceaccounts-view \
     --clusterrole=view \
     --group=system:serviceaccounts:my-namespace \
     --namespace=my-namespace
   ```

4. 对集群范围内的所有服务账户授予一个受限角色（不鼓励）

   如果您不想管理每个命名空间的权限，则可以将集群范围角色授予所有服务帐户。

   下面的例子将所有命名空间中的只读权限授予集群中的所有服务账户：

   ```bash
   kubectl create clusterrolebinding serviceaccounts-view \
     --clusterrole=view \
     --group=system:serviceaccounts
   ```

5. 授予超级用户访问权限给集群范围内的所有服务帐户（强烈不鼓励）

   如果您根本不关心权限分块，您可以对所有服务账户授予超级用户访问权限。

   警告：这种做法将允许任何具有读取权限的用户访问secret或者通过创建一个容器的方式来访问超级用户的凭据。

   ```bash
   kubectl create clusterrolebinding serviceaccounts-cluster-admin \
     --clusterrole=cluster-admin \
     --group=system:serviceaccounts
   ```

## 从版本1.5升级

在Kubernetes 1.6之前，许多部署使用非常宽泛的ABAC策略，包括授予对所有服务帐户的完整API访问权限。

默认的RBAC策略将授予控制平面组件（control-plane components）、节点（nodes）和控制器（controller）一组范围受限的权限， 但对于”kube-system”命名空间以外的服务账户，则*不授予任何权限*（超出授予所有认证用户的发现权限）。

虽然安全性更高，但这可能会影响到期望自动接收API权限的现有工作负载。 以下是管理此转换的两种方法：

### 并行授权器（authorizer）

同时运行RBAC和ABAC授权器，并包括旧版ABAC策略：

```
--authorization-mode=RBAC,ABAC --authorization-policy-file=mypolicy.jsonl
```

RBAC授权器将尝试首先授权请求。如果RBAC授权器拒绝API请求，则ABAC授权器将被运行。这意味着RBAC策略*或者*ABAC策略所允许的任何请求都是可通过的。

当以日志级别为2或更高（`--v = 2`）运行时，您可以在API Server日志中看到RBAC拒绝请求信息（以`RBAC DENY:`为前缀）。 您可以使用该信息来确定哪些角色需要授予哪些用户，用户组或服务帐户。 一旦[授予服务帐户角色](https://k8smeetup.github.io/docs/admin/authorization/rbac/#service-account-permissions)，并且服务器日志中没有RBAC拒绝消息的工作负载正在运行，您可以删除ABAC授权器。

### 宽泛的RBAC权限

您可以使用RBAC角色绑定来复制一个宽泛的策略。

**警告：以下政策略允许所有服务帐户作为集群管理员。 运行在容器中的任何应用程序都会自动接收服务帐户凭据，并且可以对API执行任何操作，包括查看secret和修改权限。 因此，并不推荐使用这种策略。**

```bash
kubectl create clusterrolebinding permissive-binding \
  --clusterrole=cluster-admin \
  --user=admin \
  --user=kubelet \
  --group=system:serviceaccounts
```
