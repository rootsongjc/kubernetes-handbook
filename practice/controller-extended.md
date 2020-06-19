# 扩展控制器

Kubernetes 原生提供了 Deployment、StatefulSet、DaemonSet、Job、CronJob 等一系列控制器，这些控制器组成了云原生应用的基本原语，但是在 Kubernetes 的实际生产使用过程中，往往很难直接满足要求，因此又诞生了很多第三方的扩展控制器。本节将为大家介绍系列第三方扩展控制器，这些控制器融合了 Kubernetes 生产使用中的最佳实践。