---
title: Service Account
---

Service account是为了方便Pod里面的进程调用Kubernetes API或其他外部服务，它不同于User account：

- User account是为人设计的，而service account则是为了Pod中的进程；
- User account是跨namespace的，而service account则是仅局限它所在的namespace；
- 开启ServiceAccount（默认开启）后，每个namespace都会自动创建一个Service account，并会相应的secret挂载到每一个Pod中
  - 默认ServiceAccount为default，自动关联一个访问kubernetes API的[Secret](Secret.md)
  - 每个Pod在创建后都会自动设置`spec.serviceAccount`为default（除非指定了其他ServiceAccout）
  - 每个container启动后都会挂载对应的token和`ca.crt`到`/var/run/secrets/kubernetes.io/serviceaccount/`

  当然了，也可以创建更多的Service Account：
  
```
$ cat > /tmp/serviceaccount.yaml <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: build-robot
  namespace: default
EOF
$ kubectl create -f /tmp/serviceaccount.yaml
serviceaccounts/build-robot
``` 

Service Account为服务提供了一种方便的认知机制，但它不关心授权的问题。可以配合[RBAC](https://kubernetes.io/docs/admin/authorization/#a-quick-note-on-service-accounts)来为Service Account鉴权：
- 配置`--authorization-mode=RBAC`和`--runtime-config=rbac.authorization.k8s.io/v1alpha1`
- 配置`--authorization-rbac-super-user=admin`
- 定义Role、ClusterRole、RoleBinding或ClusterRoleBinding

比如

```yaml
# This role allows to read pods in the namespace "default"
kind: Role
apiVersion: rbac.authorization.k8s.io/v1alpha1
metadata:
  namespace: default
  name: pod-reader
rules:
  - apiGroups: [""] # The API group "" indicates the core API Group.
    resources: ["pods"]
    verbs: ["get", "watch", "list"]
    nonResourceURLs: []
---
# This role binding allows "default" to read pods in the namespace "default"
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1alpha1
metadata:
  name: read-pods
  namespace: default
subjects:
  - kind: ServiceAccount # May be "User", "Group" or "ServiceAccount"
    name: default
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```




