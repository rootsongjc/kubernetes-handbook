# 在kubernetes中创建用户并授予用户namespace的admin权限

使用`create-user.sh`脚本创建namespace和用户（同名），并将该namespace的admin权限授予该用户。

## 使用前提

使用该脚本需要满足以下前提：

- 所有的证书文件都在`/etc/kubernetes/ssl`目录下
- 执行该脚本的主机可以访问kubernetes集群，并用于最高管理员权限

## 使用方式

```bash
./create-user.sh <api_server> <username>
```

最后生成了`$username.kubeconfig`文件。

## 参考

[创建用户认证授权的kubeconfig文件](../../guide/kubectl-user-authentication-authorization.md)