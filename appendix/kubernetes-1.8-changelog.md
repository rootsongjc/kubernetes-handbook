# Kubernetes1.8更新日志

2017年9月28日，kubernetes1.8版本发布。该版本中包括了一些功能改进和增强，并增加了项目的成熟度，将强了kubernetes的治理模式，这些都将有利于kubernetes项目的持续发展。

## 聚焦安全性

Kubernetes1.8的[基于角色的访问控制（RBAC）](https://en.wikipedia.org/wiki/Role-based_access_control)成为stable支持。RBAC允许集群管理员[动态定义角色](https://kubernetes.io/docs/admin/authorization/rbac/)对于Kubernetes API的访问策略。通过[网络策略](https://kubernetes.io/docs/concepts/services-networking/network-policies/)筛选出站流量的Beta支持，增强了对入站流量进行过滤的现有支持。 RBAC和网络策略是强化Kubernetes内组织和监管安全要求的两个强大工具。

Kubelet的传输层安全性（TLS）证书轮换成为beta版。自动证书轮换减轻了集群安全性运维的负担。

## 聚焦工作负载支持

Kubernetes 1.8通过apps/v1beta2组和版本推动核心工作负载API的beta版本。Beta版本包含当前版本的Deployment、DaemonSet、ReplicaSet和StatefulSet。 工作负载API是将现有工作负载迁移到Kubernetes以及开发基于Kubernetes的云原生应用程序提供了基石。

对于那些考虑在Kubernetes上运行大数据任务的，现在的工作负载API支持运行kubernetes[原生支持的Apache Spark](https://apache-spark-on-k8s.github.io/userdocs/)。

批量工作负载，比如夜间ETL工作，将从[CronJobs](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)的beta版本中受益。

[自定义资源定义（CRD）](https://kubernetes.io/docs/concepts/api-extension/custom-resources/)在Kubernetes 1.8中依然为测试版。CRD提供了一个强大的机制来扩展Kubernetes和用户定义的API对象。 CRD的一个用例是通过Operator Pattern自动执行复杂的有状态应用，例如[键值存储](https://github.com/coreos/etcd-operator)、数据库和[存储引擎](https://rook.io/)。随着稳定性的继续推进，预计将继续加强对CRD的[验证](https://kubernetes.io/docs/tasks/access-kubernetes-api/extend-api-custom-resource-definitions/#validation)。

## 更多

Volume快照、PV调整大小、自动taint、pod优先级、kubectl插件等！

除了稳定现有的功能，Kubernetes 1.8还提供了许多预览新功能的alpha版本。

社区中的每个特别兴趣小组（SIG）都在继续为所在领域的用户提供更多的功能。有关完整列表，请访问[发行说明](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.8.md)。
