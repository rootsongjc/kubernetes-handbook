# 配置 Pod 的 Service Account

Service account 为 Pod 中的进程提供身份信息。

*本文是关于 Service Account 的用户指南，管理指南另见 Service Account 的集群管理指南 。*

*注意：本文档描述的关于 Service Account 的行为只有当您按照 Kubernetes 项目建议的方式搭建起集群的情况下才有效。您的集群管理员可能在您的集群中有自定义配置，这种情况下该文档可能并不适用。*

当您（真人用户）访问集群（例如使用`kubectl`命令）时，apiserver 会将您认证为一个特定的 User Account（目前通常是`admin`，除非您的系统管理员自定义了集群配置）。Pod 容器中的进程也可以与 apiserver 联系。 当它们在联系 apiserver 的时候，它们会被认证为一个特定的 Service Account（例如`default`）。

## 使用默认的 Service Account 访问 API server

当您创建 pod 的时候，如果您没有指定一个 service account，系统会自动得在与该pod 相同的 namespace 下为其指派一个`default` service account。如果您获取刚创建的 pod 的原始 json 或 yaml 信息（例如使用`kubectl get pods/podename -o yaml`命令），您将看到`spec.serviceAccountName`字段已经被设置为 [automatically set](https://kubernetes.io/docs/user-guide/working-with-resources/#resources-are-automatically-modified) 。

您可以在 pod 中使用自动挂载的 service account 凭证来访问 API，如 [Accessing the Cluster](https://kubernetes.io/docs/user-guide/accessing-the-cluster/#accessing-the-api-from-a-pod) 中所描述。

Service account 是否能够取得访问 API 的许可取决于您使用的 [授权插件和策略](https://kubernetes.io/docs/admin/authorization/#a-quick-note-on-service-accounts)。

在 1.6 以上版本中，您可以选择取消为 service account 自动挂载 API 凭证，只需在 service account 中设置 `automountServiceAccountToken: false`：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: build-robot
automountServiceAccountToken: false
...
```

在 1.6 以上版本中，您也可以选择只取消单个 pod 的 API 凭证自动挂载：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  serviceAccountName: build-robot
  automountServiceAccountToken: false
  ...
```

如果在 pod 和 service account 中同时设置了 `automountServiceAccountToken` , pod 设置中的优先级更高。

## 使用 Service Account 作为用户权限管理配置 kubeconfig

### 创建服务账号
```
kubectl create serviceaccount sample-sc
```
这时候我们将得到一个在 default namespace 的 serviceaccount 账号；
我们运行`kubectl get serviceaccount sample-sc` 将得到如下结果:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  creationTimestamp: 2018-09-03T02:00:37Z
  labels:
    from: mofang
  name: mofang-viewer-sc
  namespace: default
  resourceVersion: "18914458"
  selfLink: /api/v1/namespaces/default/serviceaccounts/sample-sc
  uid: 26e129dc-af1d-11e8-9453-00163e0efab0
secrets:
- name: sample-sc-token-9x7nk
```

因为我们在使用 serviceaccount 账号配置 kubeconfig 的时候需要使用到 sample-sc 的 token，
该 token 保存在该 serviceaccount 保存的 secret 中；

我们运行`kubectl get secret sample-sc-token-9x7nk` 将会得到如下结果:
```yaml
apiVersion: v1
data:
  ca.crt: Ci0tLS0tQkVHSU4gQ0VSVcvfUNBVEUtLS0tLQpNSUlDL3pDQ0FtaWdBd0lCQWdJREJzdFlNQTBHQ1NxR1NJYjNEUUVCQ3dVQU1HSXhDekFKQmdOVkJBWVRBa05PCk1SRXdEd1lEVlFRSURBaGFhR1ZLYVdGdVp6RVJNQThHQTFVRUJ3d0lTR0Z1WjFwb2IzVXhFREFPQmdOVkJBb00KQjBGc2FXSmhZbUV4RERBS0JnTlZCQXNNQTBGRFV6RU5NQXNHQTFVRUF3d0VjbTl2ZERBZUZ3MHhPREExTWprdwpNelF3TURCYUZ3MHpPREExTWpRd016UTFOVGxhTUdveEtqQW9CZ05WQkFvVElXTTJaVGxqTm1KallUY3pZakUwClkyTTBZV0UzT1RNd1lqTTROREV4TkRaallURVFNQTRHQTFVRUN4TUhaR1ZtWVhWc2RERXFNQ2dHQTFVRUF4TWgKWXpabE9XTTJZbU5oTnpOaU1UUmpZelJoWVRjNU16QmlNemcwTVRFME5tTmhNSUdmTUEwR0NTcUdTSWIzRFFFQgpBUVVBQTRHTkFEQ0JpUUtCZ1FETGNFWmJycCtBa0taNHU4TklVM25jaFU4YkExMnhKR0pJMzlxdTd4aFFsR3lHCmZqQTFqdXV4cVMyaE4vTGpwM21XNkdIaW0zd2lJd2N1WUtUN3RGOW9UejgrTzhBQzZHYnpkWExIL1RQTWtCZ2YKOVNYaEdod1hndklMb3YzbnZlS1MzRElxU3UreS9OK1huMzhOOW53SHF6S0p2WE1ROWtJaUJuTXgwVnlzSFFJRApBUUFCbzRHNk1JRzNNQTRHQTFVZER3RUIvd1FFQXdJQ3JEQVBCZ05WSFJNQkFmOEVCVEFEQVFIL01COEdBMVVkCkl3UVlNQmFBRklWYS85MGp6U1Z2V0VGdm5tMUZPWnRZZlhYL01Ed0dDQ3NHQVFVRkJ3RUJCREF3TGpBc0JnZ3IKQmdFRkJRY3dBWVlnYUhSMGNEb3ZMMk5sY25SekxtRmpjeTVoYkdsNWRXNHVZMjl0TDI5amMzQXdOUVlEVlIwZgpCQzR3TERBcW9DaWdKb1lrYUhSMGNEb3ZMMk5sY25SekxtRmpjeTVoYkdsNWRXNHl0TDNKdmIzUXVZM0pzCk1BMEdDU3FHU0liM0RRRUJDd1VBQTRHQkFKWFRpWElvQ1VYODFFSU5idVRTay9PanRJeDM0ckV0eVBuTytBU2oKakszaTR3d1BRMEt5MDhmTlNuU2Z4Q1EyeEY1NTIxNVNvUzMxU3dMellJVEp1WFpBN2xXT29RU1RZL2lBTHVQQgovazNCbDhOUGNmejhGNXlZNy9uY1N6WDRwTXgxOHIwY29PTE1iZlpUUXJtSHBmQ053bWRjQmVCK0JuRFJMUEpGCmgzSUQKLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQoKCg==
  namespace: ZGVmYXAsdA==
  token: ZXlKaGJHY2lPaUpTVXpJMU5pSXNJblI1Y0NJNklrcFhppppppo5LmV5SnBjM01pT2lKcmRXSmxjbTVsZddekwzTmxjblpwWTJWaFkyTnZkVzUwSWl3aWEzVmlaWEp1WlhSbGN5NXBieTl6WlhKMmFXTmxZV05qYjNWdWRDOXVZVzFsYzNCaFkyVWlPaUprWldaaGRXeDBJaXdpYTNWaVpYSnVaWFJsY3k1cGJ5OXpaWEoyYVdObFlXTmpiM1Z1ZEM5elpXTnlaWFF1Ym1GdFpTSTZJbTF2Wm1GdVp5MTJhV1YzWlhJdGMyTXRkRzlyWlc0dE9YZzNibXNpTENKcmRXSmxjbTVsZEdWekxtbHZMM05sY25acFkyVmhZMk52ZFc1MEwzTmxjblpwWTJVdFlXTmpiM1Z1ZEM1dVlXMWxJam9pYlc5bVlXNW5MWFpwWlhkbGNpMXpZeUlzSW10MVltVnlibVYwWlhNdWFXOHZjMlZ5ZG1salpXRmpZMjkxYm5RdmMyVnlkbWxqWlMxaFkyTnZkVzUwTG5WcFpDSTZJakkyWlRFeU9XUmpMV0ZtTVdRdE1URmxPQzA1TkRVekxUQXdNVFl6WlRCbFptRmlNQ0lzSW5OMVlpSTZJbk41YzNSbGJUcHpaWEoyYVdObFlXTmpiM1Z1ZERwa1pXWmhkV3gwT20xdlptRnVaeTEyYVdWM1pYSXRjMk1pZlEuQWpudnZueXRaWHJ1UndSdEJ3S3RFdzZWNzJpWU1vOUI2LVh3VmkzRWhReXNOM21PLXJvdGFJQnZHUFlNMGZNVDlWRzVjTFFKYmJWUmhLR0FyclUyQ1FNVl9JQ3NpbjFzMjFxTXJ5dngzNm9abzFYZkpWZlVVMEtqeWxndEQ0NTNmWU84SlFfWFF3OGNwVWc5NGE2WnZvcDZHcXNGNGhzT0sxTjFMaGRrSFBpWHA4TzRQUzJ6eDFXNklfeGs2ZUNBcjUxRVpwSktEWTZHMmhmZ1A5emxROGdPV21nbS1EVjZPZzNobjJ4UFprZUktVk1nYUF3amdFUGtVZFJDSndYRk9QRG5UcXlqUmtZVzdLVU1GLTVDTHdBNDZMNk5PYjJ6YUR0Uy16Zm5hdVFwLVdIcFNQdDNEdFc0UmRLZDVDZzE3Z3RGaWhRZzI3dnVqYWJNMGpmQmp3
kind: Secret
metadata:
  annotations:
    kubernetes.io/service-account.name: sample-sc
    kubernetes.io/service-account.uid: 26e129dc-af1d-11e8-9453-00163e0efab0
  creationTimestamp: 2018-09-03T02:00:37Z
  name: mofang-viewer-sc-token-9x7nk
  namespace: default
  resourceVersion: "18914310"
  selfLink: /api/v1/namespaces/default/secrets/sample-sc-token-9x7nk
  uid: 26e58b7c-af1d-11e8-9453-00163e0efab0
type: kubernetes.io/service-account-token
```

其中 `{data.token}` 就会是我们的用户 token 的 base64 编码，之后我们配置 kubeconfig 的时候将会用到它；

### 创建角色
比如我们想创建一个只可以查看集群`deployments`，`services`，`pods` 相关的角色，应该使用如下配置
```yaml
apiVersion: rbac.authorization.k8s.io/v1
## 这里也可以使用 Role
kind: ClusterRole
metadata:
  name: mofang-viewer-role
  labels:
    from: mofang
rules:
- apiGroups:
  - ""
  resources:
  - pods
  - pods/status
  - pods/log
  - services
  - services/status
  - endpoints
  - endpoints/status
  - deployments
  verbs:
  - get
  - list
  - watch
```

### 创建角色绑定
```yaml
apiVersion: rbac.authorization.k8s.io/v1
## 这里也可以使用 RoleBinding
kind: ClusterRoleBinding
metadata:
  name: sample-role-binding
  labels:
    from: mofang
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: mofang-viewer-role
subjects:
- kind: ServiceAccount
  name: sample-sc
  namespace: default
```

### 配置 kubeconfig
经过以上的步骤，我们最开始创建的 serviceaccount 就可以用来访问我们的集群了，
同时我们可以动态更改 `ClusterRole` 的授权来及时控制某个账号的权限(这也是使用 serviceaccount 的好处)；

配置应该如下:
```yaml
apiVersion: v1
clusters:
- cluster:
    ## 这个是集群的 TLS 证书，与授权无关，使用同一的就可以
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUMvekNDQW1pZ0F3SUJBZ0lEQnN0WU1BMEdDU3FHU0liM0RRRUJDd1VBTUdJeEN6QUpCZ05WQkFZVEFrTk8KTVJFd0R3WURWUVFJREFoYWFHVkthV0Z1WnpFUk1BOEdBMVVFQnd3SVNHRnVaMXBvYjNVeEVEQU9CZ05WQkFvTQpCMEZzYVdKaFltRXhEREFLQmdOVkJBc01BMEZEVXpFTk1Bc0dBMVVFQXd3RWNtOXZkREFlRncweE9EQTFNamt3Ck16UXdNREJhRncwek9EQTFNalF3TXpRMU5UbGFNR294S2pBb0JnTlZCQW9USVdNMlpUbGpObUpqWVRjellqRTAKWTJNMFlXRTNPVE13WWpNNE5ERXhORFpqWVRFUU1BNEdBMVVFQ3hNSFpHVm1ZWFZzZERFcU1DZ0dBMVVFQXhNaApZelpsT1dNMlltTmhOek5pTVRSall6UmhZVGM1TXpCaU16ZzBNVEUwTm1OaE1JR2ZNQTBHQ1NxR1NJYjNEUUVCCkFRVUFBNEdOQURDQmlRS0JnUURMY0VaYnJwK0FrS1o0dThOSVUzbmNoVThiQTEyeEpHSkkzOXF1N3hoUWxHeUcKZmpBMWp1dXhxUzJoTi9ManAzbVc2R0hpbTN3aUl3Y3VZS1Q3dEY5b1R6OCtPOEFDNkdiemRYTEgvVFBNa0JnZgo5U1hoR2h3WGd2SUxvdjNudmVLUzNESXFTdSt5L04rWG4zOE45bndIcXpLSnZYTVE5a0lpQm5NeDBWeXNIUUlECkFRQUJvNEc2TUlHM01BNEdBMVVkRHdFQi93UUVBd0lDckRBUEJnTlZIUk1CQWY4RUJUQURBUUgvTUI4R0ExVWQKSXdRWU1CYUFGSVZhLzkwanpTVnZXRUZ2bm0xRk9adFlmWFgvTUR3R0NDc0dBUVVGQndFQkJEQXdMakFzQmdncgpCZ0VGQlFjd0FZWWdhSFIwY0RvdkwyTmxjblJ6TG1GamN5NWhiR2w1ZFc0dVkyOXRMMjlqYzNBd05RWURWUjBmCkJDNHdMREFxb0NpZ0pvWWthSFIwY0RvdkwyTmxjblJ6TG1GamN5NWhiR2w1ZFc0dVkyOXRMM0p2YjNRdVkzSnMKTUEwR0NTcUdTSWIzRFFFQkN3VUFBNEdCQUpYVGlYSW9DVVg4MUVJTmJ1VFNrL09qdEl4MzRyRXR5UG5PK0FTagpqSzNpNHd3UFEwS3kwOGZOU25TZnhDUTJ4RjU1MjE1U29TMzFTd0x6WUlUSnVYWkE3bFdPb1FTVFkvaUFMdVBCCi9rM0JsOE5QY2Z6OEY1eVk3L25jU3pYNHBNeDE4cjBjb09MTWJmWlRRcm1IcGZDTndtZGNCZUIrQm5EUkxQSkYKaDNJRAotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==
    server: https://47.95.24.167:6443
  name: beta
contexts:
- context:
    cluster: beta
    user: beta-viewer
  name: beta-viewer
current-context: beta-viewer
kind: Config
preferences: {}
users:
- name: beta-viewer
  user:
    ## 这个使我们在创建 serviceaccount 生成相关 secret 之后的 data.token 的 base64 解码字符，它本质是一个 jwt token
    token: eyJhbGciOiJSUzI1NiIsInR5dffg6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6Im1vZmFuZy12aWV3ZXItc2MtdG9rZW4tOXg3bmsiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoibW9mYW5nLXZpZXdlci1zYyIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6IjxZTEyOWRjLWFmMWQtMTFlOC05NDUzLTAwMTYzZTBlZmFiMCIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0Om1vZmFuZy12aWV3ZXItc2MifQ.AjnvvnytZXruRwRtBwKtEw6V72iYMo9B6-XwVi3EhQysN3mO-rotaIBvGPYM0fMT9VG5cLQJbbVRhKGArrU2CQMV_ICsin1s21qMryvx36oZo1XfJVfUU0KjylgtD453fYO8JQ_XQw8cpUg94a6Zvop6GqsF4hsOK1N1LhdkHPiXp8O4PS2zx1W6I_xk6eCAr51EZpJKDY6G2hfgP9zlQ8gOWmgm-DV6Og3hn2xPZkeI-VMgaAwjgEPkUdRCJwXFOPDnTqyjRkYW7KUMF-5CLwA46L6NOb2zaDtS-zfnauQp-WHpSPt3DtW4RdKd5Cg17gtFihQg27vujabM0jfBjw
```

## 使用多个Service Account

每个 namespace 中都有一个默认的叫做 `default` 的 service account 资源。

您可以使用以下命令列出 namespace 下的所有 serviceAccount 资源。

```bash
$ kubectl get serviceAccounts
NAME      SECRETS    AGE
default   1          1d
```

您可以像这样创建一个 ServiceAccount 对象：

```bash
$ cat > /tmp/serviceaccount.yaml <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: build-robot
EOF
$ kubectl create -f /tmp/serviceaccount.yaml
serviceaccount "build-robot" created
```

如果您看到如下的 service account 对象的完整输出信息：

```bash
$ kubectl get serviceaccounts/build-robot -o yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  creationTimestamp: 2015-06-16T00:12:59Z
  name: build-robot
  namespace: default
  resourceVersion: "272500"
  selfLink: /api/v1/namespaces/default/serviceaccounts/build-robot
  uid: 721ab723-13bc-11e5-aec2-42010af0021e
secrets:
- name: build-robot-token-bvbk5
```

然后您将看到有一个 token 已经被自动创建，并被 service account 引用。

您可以使用授权插件来 [设置 service account 的权限](https://kubernetes.io/docs/admin/authorization/#a-quick-note-on-service-accounts) 。

设置非默认的 service account，只需要在 pod 的`spec.serviceAccountName` 字段中将name设置为您想要用的 service account 名字即可。

在 pod 创建之初 service account 就必须已经存在，否则创建将被拒绝。

您不能更新已创建的 pod 的 service account。

您可以清理 service account，如下所示：

```bash
$ kubectl delete serviceaccount/build-robot
```

## 手动创建 service account 的 API token

假设我们已经有了一个如上文提到的名为 ”build-robot“ 的 service account，我们手动创建一个新的 secret。

```bash
$ cat > /tmp/build-robot-secret.yaml <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: build-robot-secret
  annotations: 
    kubernetes.io/service-account.name: build-robot
type: kubernetes.io/service-account-token
EOF
$ kubectl create -f /tmp/build-robot-secret.yaml
secret "build-robot-secret" created
```

现在您可以确认下新创建的 secret 取代了 "build-robot" 这个 service account 原来的 API token。

所有已不存在的 service account 的 token 将被 token controller 清理掉。

```bash
$ kubectl describe secrets/build-robot-secret 
Name:   build-robot-secret
Namespace:  default
Labels:   <none>
Annotations:  kubernetes.io/service-account.name=build-robot,kubernetes.io/service-account.uid=870ef2a5-35cf-11e5-8d06-005056b45392

Type: kubernetes.io/service-account-token

Data
====
ca.crt: 1220 bytes
token: ...
namespace: 7 bytes
```

> 注意该内容中的`token`被省略了。

## 为 service account 添加 ImagePullSecret

首先，创建一个 imagePullSecret，详见[这里](https://kubernetes.io/docs/concepts/containers/images/#specifying-imagepullsecrets-on-a-pod)。

然后，确认已创建。如：

```Bash
$ kubectl get secrets myregistrykey
NAME             TYPE                              DATA    AGE
myregistrykey    kubernetes.io/.dockerconfigjson   1       1d
```

然后，修改 namespace 中的默认 service account 使用该 secret 作为 imagePullSecret。

```bash
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "myregistrykey"}]}'
```

Vi 交互过程中需要手动编辑：

```bash
$ kubectl get serviceaccounts default -o yaml > ./sa.yaml
$ cat sa.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  creationTimestamp: 2015-08-07T22:02:39Z
  name: default
  namespace: default
  resourceVersion: "243024"
  selfLink: /api/v1/namespaces/default/serviceaccounts/default
  uid: 052fb0f4-3d50-11e5-b066-42010af0d7b6
secrets:
- name: default-token-uudge
$ vi sa.yaml
[editor session not shown]
[delete line with key "resourceVersion"]
[add lines with "imagePullSecret:"]
$ cat sa.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  creationTimestamp: 2015-08-07T22:02:39Z
  name: default
  namespace: default
  selfLink: /api/v1/namespaces/default/serviceaccounts/default
  uid: 052fb0f4-3d50-11e5-b066-42010af0d7b6
secrets:
- name: default-token-uudge
imagePullSecrets:
- name: myregistrykey
$ kubectl replace serviceaccount default -f ./sa.yaml
serviceaccounts/default
```

现在，所有当前 namespace 中新创建的 pod 的 spec 中都会增加如下内容：

```yaml
spec:
  imagePullSecrets:
  - name: myregistrykey
```
