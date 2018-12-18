# 使用CRD扩展Kubernetes API

本文是如何创建 CRD 来扩展 Kubernetes API 的教程。CRD 是用来扩展 Kubernetes 最常用的方式，在 Service Mesh 和 Operator 中也被大量使用。因此读者如果想在 Kubernetes 上做扩展和开发的话，是十分有必要了解 CRD 的。

在阅读本文前您需要先了解[使用自定义资源扩展 API](custom-resource.md)， 以下内容译自 [Kubernetes 官方文档](https://kubernetes.io/docs/tasks/access-kubernetes-api/custom-resources/custom-resource-definitions/)，有删改，推荐阅读[如何从零开始编写一个 Kubernetes CRD](http://www.servicemesher.com/blog/kubernetes-crd-quick-start/)。

## 创建 CRD（CustomResourceDefinition）

创建新的 CustomResourceDefinition（CRD）时，Kubernetes API Server 会为您指定的每个版本创建新的 RESTful 资源路径。CRD 可以是命名空间的，也可以是集群范围的，可以在 CRD `scope` 字段中所指定。与现有的内置对象一样，删除命名空间会删除该命名空间中的所有自定义对象。CustomResourceDefinition 本身是非命名空间的，可供所有命名空间使用。

参考下面的 CRD，将其配置保存在 `resourcedefinition.yaml` 文件中：

```yaml
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  # 名称必须符合下面的格式：<plural>.<group>
  name: crontabs.stable.example.com
spec:
  # REST API使用的组名称：/apis/<group>/<version>
  group: stable.example.com
  # REST API使用的版本号：/apis/<group>/<version>
  version: v1
  # Namespaced或Cluster
  scope: Namespaced
  names:
    # URL中使用的复数名称: /apis/<group>/<version>/<plural>
    plural: crontabs
    # CLI中使用的单数名称
    singular: crontab
    # CamelCased格式的单数类型。在清单文件中使用
    kind: CronTab
    # CLI中使用的资源简称
    shortNames:
    - ct
```

创建该 CRD：

```bash
kubectl create -f resourcedefinition.yaml
```

访问 RESTful API 端点如 <http://172.20.0.113:8080> 将看到如下 API 端点已创建：

```bash
/apis/stable.example.com/v1/namespaces/*/crontabs/...
```

然后，此端点 URL 可用于创建和管理自定义对象。上面的 CRD 中定义的类型就是 `CronTab`。

可能需要几秒钟才能创建端点。您可以监控 CustomResourceDefinition 中 `Established` 的状态何时为 true，或者查看 API 资源的发现信息中是否显示了您的资源。

## 创建自定义对象

创建 CustomResourceDefinition 对象后，您可以创建自定义对象。自定义对象可包含自定义字段。这些字段可以包含任意  JSON。在以下示例中， `cronSpec` 和 `image` 自定义字段在自定义对象中设置 `CronTab`。`CronTab` 类型来自您在上面创建的 CustomResourceDefinition 对象的规范。

如果您将以下 YAML 保存到`my-crontab.yaml`：

```yaml
apiVersion: "stable.example.com/v1"
kind: CronTab
metadata:
  name: my-new-cron-object
spec:
  cronSpec: "* * * * */5"
  image: my-awesome-cron-image
```

并创建它：

```bash
kubectl create -f my-crontab.yaml
```

然后，您可以使用 kubectl 管理 CronTab 对象。例如：

```bash
kubectl get crontab
```

应该打印这样的列表：

```bash
NAME                 AGE
my-new-cron-object   6s
```

使用 kubectl 时，资源名称不区分大小写，您可以使用 CRD 中定义的单数或复数形式，以及任何短名称。

您还可以查看原始 YAML 数据：

```bash
kubectl get ct -o yaml
```

您应该看到它的 yaml 中的自定义 `cronSpec` 和 `image` 字段：

```yaml
apiVersion: v1
items:
- apiVersion: stable.example.com/v1
  kind: CronTab
  metadata:
    clusterName: ""
    creationTimestamp: 2017-05-31T12:56:35Z
    deletionGracePeriodSeconds: null
    deletionTimestamp: null
    name: my-new-cron-object
    namespace: default
    resourceVersion: "285"
    selfLink: /apis/stable.example.com/v1/namespaces/default/crontabs/my-new-cron-object
    uid: 9423255b-4600-11e7-af6a-28d2447dc82b
  spec:
    cronSpec: '* * * * */5'
    image: my-awesome-cron-image
kind: List
metadata:
  resourceVersion: ""
  selfLink: ""
```

## 删除 CustomResourceDefinition

删除 CustomResourceDefinition 时，服务器将删除 RESTful API 端点并**删除存储在其中的所有自定义对象**。

```bash
kubectl delete -f resourcedefinition.yaml
kubectl get crontabs
Error from server (NotFound): Unable to list "crontabs": the server could not find the requested resource (get crontabs.stable.example.com)
```

如果稍后重新创建相同的 CustomResourceDefinition，它将从空开始。

## 提供 CRD 的多个版本

有关提供 CustomResourceDefinition 的多个版本以及将对象从一个版本迁移到另一个[版本](https://kubernetes.io/docs/tasks/access-kubernetes-api/custom-resources/custom-resource-definition-versioning/)的详细信息，请参阅[自定义资源定义版本控制](https://kubernetes.io/docs/tasks/access-kubernetes-api/custom-resources/custom-resource-definition-versioning/)。

## 高级主题

### Finalizer（终结器）

*Finalizer（终结器）*允许控制器实现异步预删除 hook。自定义对象支持终结器，就像内置对象一样。

您可以将终结器添加到自定义对象，如下所示：

```yaml
apiVersion: "stable.example.com/v1"
kind: CronTab
metadata:
  finalizers:
  - finalizer.stable.example.com
```

终结器是任意字符串值，当存在时确保在资源存在时不可能进行硬删除。

对具有终结器的对象的第一个删除请求设置该`metadata.deletionTimestamp`字段的值， 但不删除它。设置此值后，`finalizer` 只能删除列表中的条目。

如果设置了 `metadata.deletionTimestamp` 字段，控制器监控对象将执行它们所有的终结器，对该对象轮询更新请求。执行完所有终结器后，将删除该资源。

值`metadata.deletionGracePeriodSeconds`控制轮询更新之间的间隔。

每个控制器都有责任从列表中删除其终结器。

如果终结器列表为空，Kubernetes 最终只会删除该对象，这意味着所有终结器都已执行。

### Validation（验证）

**功能状态：** `Kubernetes v1.12` [beta](https://kubernetes.io/docs/tasks/access-kubernetes-api/custom-resources/custom-resource-definitions/#)

可以通过 [OpenAPI v3 schema](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#schemaObject)验证自定义对象是否符合标准 。此外，以下限制适用于 schema：

- 字段`default`、`nullable`、`discriminator`、`readOnly`、`writeOnly`、`xml`、 `deprecated` 和 `$ref` 不能设置。
- 该字段 `uniqueItems` 不能设置为 true。
- 该字段 `additionalProperties` 不能设置为 false。

您可以使用 [kube-apiserver](https://kubernetes.io/docs/admin/kube-apiserver)`CustomResourceValidation` 上的功能门（feature gate）禁用此功能：

```
--feature-gates=CustomResourceValidation=false
```

该 schema 在 CustomResourceDefinition 中定义。在以下示例中，CustomResourceDefinition 对自定义对象应用以下验证：

- `spec.cronSpec`  必须是字符串，并且必须是正则表达式描述的形式。
- `spec.replicas`  必须是整数，且最小值必须为 1，最大值为 10。

将 CustomResourceDefinition 保存到 `resourcedefinition.yaml`：

```yaml
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  name: crontabs.stable.example.com
spec:
  group: stable.example.com
  versions:
    - name: v1
      served: true
      storage: true
  version: v1
  scope: Namespaced
  names:
    plural: crontabs
    singular: crontab
    kind: CronTab
    shortNames:
    - ct
  validation:
   # openAPIV3Schema 适用于验证自定义对象的 schema。
    openAPIV3Schema:
      properties:
        spec:
          properties:
            cronSpec:
              type: string
              pattern: '^(\d+|\*)(/\d+)?(\s+(\d+|\*)(/\d+)?){4}$'
            replicas:
              type: integer
              minimum: 1
              maximum: 10
```

并创建它：

```bash
kubectl create -f resourcedefinition.yaml
```

`CronTab` 如果其字段中存在无效值，则将拒绝创建类型的自定义对象的请求。在以下示例中，自定义对象包含具有无效值的字段：

- `spec.cronSpec` 与正则表达式不匹配。
- `spec.replicas` 大于10。

如果您将以下YAML保存到`my-crontab.yaml`：

```yaml
apiVersion: "stable.example.com/v1"
kind: CronTab
metadata:
  name: my-new-cron-object
spec:
  cronSpec: "* * * *"
  image: my-awesome-cron-image
  replicas: 15
```

并创建它：

```bash
kubectl create -f my-crontab.yaml
```

你会收到一个错误：

```bash
The CronTab "my-new-cron-object" is invalid: []: Invalid value: map[string]interface {}{"apiVersion":"stable.example.com/v1", "kind":"CronTab", "metadata":map[string]interface {}{"name":"my-new-cron-object", "namespace":"default", "deletionTimestamp":interface {}(nil), "deletionGracePeriodSeconds":(*int64)(nil), "creationTimestamp":"2017-09-05T05:20:07Z", "uid":"e14d79e7-91f9-11e7-a598-f0761cb232d1", "selfLink":"", "clusterName":""}, "spec":map[string]interface {}{"cronSpec":"* * * *", "image":"my-awesome-cron-image", "replicas":15}}:
validation failure list:
spec.cronSpec in body should match '^(\d+|\*)(/\d+)?(\s+(\d+|\*)(/\d+)?){4}$'
spec.replicas in body should be less than or equal to 10
```

如果字段包含有效值，则接受对象创建请求。

将以下 YAML 保存到 `my-crontab.yaml`：

```yaml
apiVersion: "stable.example.com/v1"
kind: CronTab
metadata:
  name: my-new-cron-object
spec:
  cronSpec: "* * * * */5"
  image: my-awesome-cron-image
  replicas: 5
```

并创建它：

```bash
kubectl create -f my-crontab.yaml
crontab "my-new-cron-object" created
```

### 其他打印列

从 Kubernetes 1.11 开始，kubectl 使用服务器端打印。服务器决定 `kubectl get` 命令显示哪些列。您可以使用 CustomResourceDefinition 自定义这些列。下面的示例将输出 `Spec`、`Replicas` 和 `Age`  列。

1. 将 CustomResourceDefinition保存到 `resourcedefinition.yaml`。

   ```yaml
     apiVersion: apiextensions.k8s.io/v1beta1
     kind: CustomResourceDefinition
     metadata:
       name: crontabs.stable.example.com
     spec:
       group: stable.example.com
       version: v1
       scope: Namespaced
       names:
         plural: crontabs
         singular: crontab
         kind: CronTab
         shortNames:
         - ct
       additionalPrinterColumns:
       - name: Spec
         type: string
         description: The cron spec defining the interval a CronJob is run
         JSONPath: .spec.cronSpec
       - name: Replicas
         type: integer
         description: The number of jobs launched by the CronJob
         JSONPath: .spec.replicas
       - name: Age
         type: date
         JSONPath: .metadata.creationTimestamp
   ```

2. 创建 CustomResourceDefinition：

   ```bash
   kubectl create -f resourcedefinition.yaml
   ```

3. 使用上一节中的创建的  `my-crontab.yaml`  实例。

4. 调用服务器端打印：

   ```bash
   kubectl get crontab my-new-cron-object
   ```

   请注意 `NAME`、`SPEC`、`REPLICAS` 和 `AGE` 在输出列：

   ```bash
     NAME                 SPEC        REPLICAS   AGE
     my-new-cron-object   * * * * *   1          7s
   ```

 `NAME` 列是隐含的，不需要在 CustomResourceDefinition 中定义。

#### Priority（优先级）

每列中都包含一个 `priority` 字段。目前，优先级区分标准视图或 wide 视图中显示的列（使用 `-o wide` 标志）。

- 具有优先级的列 `0` 显示在标准视图中。
- 优先级大于 `0` 的列仅在 wide 视图中显示。

#### Type（类型）

列中的 `type` 字段可以是以下任何一种（参考 [OpenAPI v3 数据类型](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#dataTypes)）：

- `integer` - 非浮点数
- `number` - 浮点数
- `string` - 字符串
- `boolean` - ture 或 false
- `date` - 自此时间戳以来的时间差异呈现

如果 CustomResource 中的值与为列指定的类型不匹配，则省略该值。使用 CustomResource 验证以确保值类型正确。

#### Format（格式）

列中的 `format` 字段可以是以下任何一个：

- `int32`
- `int64`
- `float`
- `double`
- `byte`
- `date`
- `date-time`
- `password`

该列 `format` 控制 `kubectl` 打印值时使用的样式。

### 子资源

**功能状态：** `Kubernetes v1.12` [beta](https://kubernetes.io/docs/tasks/access-kubernetes-api/custom-resources/custom-resource-definitions/#)

自定义资源支持 `/status` 和 `/scale` 子资源。

您可以使用 [kube-apiserver](https://kubernetes.io/docs/admin/kube-apiserver) `CustomResourceSubresources` 上的功能门（feature gate）禁用此功能：

```bash
--feature-gates=CustomResourceSubresources=false
```

可以通过在 CustomResourceDefinition 中定义它们来选择性地启用 status 和 scale 子资源。

#### 状态子资源

启用状态子资源后，将公开自定义资源的子资源 `/status`。

- 状态和规范节分别由自定义资源内的 JSONPath `.status` 和 `.spec`JSONPath 表示。
- `PUT``/status` 对子资源的请求采用自定义资源对象，并忽略除状态节之外的任何更改。
- `PUT``/status` 对子资源的请求仅验证自定义资源的状态节。
- `PUT`/ `POST`/ `PATCH` 请求自定义资源忽略更改状态节。
- 对 spec 节的任何更改都会增加 `.metadata.generation` 的值。
- 在 CRD OpenAPI 验证模式的根目录中只允许以下构造：
- - Description
  - Example
  - ExclusiveMaximum
  - ExclusiveMinimum
  - ExternalDocs
  - Format
  - Items
  - Maximum
  - MaxItems
  - MaxLength
  - Minimum
  - MinItems
  - MinLength
  - MultipleOf
  - Pattern
  - Properties
  - Required
  - Title
  - Type
  - UniqueItems

#### 扩展子资源

启用 scale 子资源后，将公开自定义资源的子资源 `/scale`。该 `autoscaling/v1.Scale` 对象作为有效负载发送 `/scale`。

要启用 scale 子资源，CustomResourceDefinition 中需要定义以下值。

- `SpecReplicasPath` 在与之对应的自定义资源中定义 JSONPath `Scale.Spec.Replicas`。
  - 这是一个必需的值。
  - `.spec`  只允许使用带点符号的 JSONPaths 。
  - 如果 `SpecReplicasPath` 自定义资源中没有值，则 `/scale` 子资源将在GET上返回错误。
- `StatusReplicasPath` 在与之对应的自定义资源中定义 JSONPath `Scale.Status.Replicas`。
  - 这是一个必需的值。
  - `.stutus` 只允许使用带点符号的 JSONPaths 。
  - 如果 `StatusReplicasPath` 自定义资源中没有值，则子资源 `/scale` 中的状态副本值将默认为 0。
- `LabelSelectorPath `在与之对应的自定义资源中定义 JSONPath `Scale.Status.Selector`。
  - 这是一个可选值。
  - 必须将其设置为与 HPA 一起使用。
  - `.status` 只允许使用带点符号的 JSONPaths 。
  - 如果 `LabelSelectorPath` 自定义资源中没有值，则子资源 `/scale` 中的状态选择器值将默认为空字符串。

在以下示例中，启用了status 和 scale 子资源。

将 CustomResourceDefinition 保存到`resourcedefinition.yaml`：

```yaml
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  name: crontabs.stable.example.com
spec:
  group: stable.example.com
  versions:
    - name: v1
      served: true
      storage: true
  scope: Namespaced
  names:
    plural: crontabs
    singular: crontab
    kind: CronTab
    shortNames:
    - ct
  # subresources describes the subresources for custom resources.
  subresources:
    # status enables the status subresource.
    status: {}
    # scale enables the scale subresource.
    scale:
      # specReplicasPath defines the JSONPath inside of a custom resource that corresponds to Scale.Spec.Replicas.
      specReplicasPath: .spec.replicas
      # statusReplicasPath defines the JSONPath inside of a custom resource that corresponds to Scale.Status.Replicas.
      statusReplicasPath: .status.replicas
      # labelSelectorPath defines the JSONPath inside of a custom resource that corresponds to Scale.Status.Selector.
      labelSelectorPath: .status.labelSelector
```

并创建它：

```bash
kubectl create -f resourcedefinition.yaml
```

创建 CustomResourceDefinition 对象后，您可以创建自定义对象。

如果您将以下 YAML 保存到 `my-crontab.yaml`：

```yaml
apiVersion: "stable.example.com/v1"
kind: CronTab
metadata:
  name: my-new-cron-object
spec:
  cronSpec: "* * * * */5"
  image: my-awesome-cron-image
  replicas: 3
```

并创建它：

```bash
kubectl create -f my-crontab.yaml
```

然后在以下位置创建新的命名空间 RESTful API 端点：

```bash
/apis/stable.example.com/v1/namespaces/*/crontabs/status
```

和

```bash
/apis/stable.example.com/v1/namespaces/*/crontabs/scale
```

可以使用该 `kubectl scale` 命令缩放自定义资源。例如，以上创建的自定义资源的的 `.spec.replicas`  设置为 5：

```bash
kubectl scale --replicas=5 crontabs/my-new-cron-object
crontabs "my-new-cron-object" scaled

kubectl get crontabs my-new-cron-object -o jsonpath='{.spec.replicas}'
5
```

### Category（分类）

类别是自定义资源所属的分组资源的列表（例如 `all`）。您可以使用 `kubectl get <category-name>` 列出属于该类别的资源。此功能是 **beta**，可用于 v1.10 中的自定义资源。

以下示例添加 `all` CustomResourceDefinition 中的类别列表，并说明如何使用 `kubectl get all` 输出自定义资源 。

将以下 CustomResourceDefinition 保存到 `resourcedefinition.yaml`：

```yaml
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  name: crontabs.stable.example.com
spec:
  group: stable.example.com
  versions:
    - name: v1
      served: true
      storage: true
  scope: Namespaced
  names:
    plural: crontabs
    singular: crontab
    kind: CronTab
    shortNames:
    - ct
    # categories is a list of grouped resources the custom resource belongs to.
    categories:
    - all
```

并创建它：

```bash
kubectl create -f resourcedefinition.yaml
```

创建 CustomResourceDefinition 对象后，您可以创建自定义对象。

将以下 YAML 保存到 `my-crontab.yaml`：

```yaml
apiVersion: "stable.example.com/v1"
kind: CronTab
metadata:
  name: my-new-cron-object
spec:
  cronSpec: "* * * * */5"
  image: my-awesome-cron-image
```

并创建它：

```bash
kubectl create -f my-crontab.yaml
```

您可以使用`kubectl get`以下方式指定类别：

```bash
kubectl get all
```

它将包括种类的自定义资源`CronTab`：

```bash
NAME                          AGE
crontabs/my-new-cron-object   3s
```

## 参考

- [Extend the Kubernetes API with CustomResourceDefinitions - kubernetes.io](https://kubernetes.io/docs/tasks/access-kubernetes-api/custom-resources/custom-resource-definitions/)
- [如何从零开始编写一个Kubernetes CRD - servicemesher.com](http://www.servicemesher.com/blog/kubernetes-crd-quick-start/)
