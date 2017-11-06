---
date: "2017-05-13T00:46:37+08:00"
draft: false
title: "Kubernete概念解析之Deployment"
categories: "kubernetes"
tags: ["kubernetes"]
bigimg: [{src: "https://res.cloudinary.com/jimmysong/image/upload/images/20170430008.jpg", desc: "京广桥@北京国贸 Apr 30,2017"}]
---

## 前言

本文同步更新到Github仓库[kubernetes-handbook](https://github.com/rootsongjc/kubernetes-handbook)中。

[本文翻译自kubernetes官方文档 - Deployement ](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/concepts/workloads/controllers/deployment.md)

本文章根据2017年5月10日的`Commit 8481c02 `翻译。

Deployment是Kubernetes中的一个非常重要的概念，从它开始是了解kubernetes中资源概念的一个很好的切入点，看到网上也没什么详细的说明文档，我就随手翻译了一下官方文档（Github中的文档），kubernetes官网上的文档还没有这个新。这篇文章对Deployment的概念解释的面面俱到十分详尽。

## Deployment是什么？

Deployment为Pod和Replica Set（下一代Replication Controller）提供声明式更新。

你只需要在Deployment中描述你想要的目标状态是什么，Deployment controller就会帮你将Pod和Replica Set的实际状态改变到你的目标状态。你可以定义一个全新的Deployment，也可以创建一个新的替换旧的Deployment。

一个典型的用例如下：

- 使用Deployment来创建ReplicaSet。ReplicaSet在后台创建pod。检查启动状态，看它是成功还是失败。
- 然后，通过更新Deployment的PodTemplateSpec字段来声明Pod的新状态。这会创建一个新的ReplicaSet，Deployment会按照控制的速率将pod从旧的ReplicaSet移动到新的ReplicaSet中。
- 如果当前状态不稳定，回滚到之前的Deployment revision。每次回滚都会更新Deployment的revision。
- 扩容Deployment以满足更高的负载。
- 暂停Deployment来应用PodTemplateSpec的多个修复，然后恢复上线。
- 根据Deployment 的状态判断上线是否hang住了。
- 清除旧的不必要的ReplicaSet。

## 创建Deployment

下面是一个Deployment示例，它创建了一个Replica Set来启动3个nginx pod。

下载示例文件并执行命令：

```shell
$ kubectl create -f docs/user-guide/nginx-deployment.yaml --record
deployment "nginx-deployment" created
```

将kubectl的 `—record` 的flag设置为 `true`可以在annotation中记录当前命令创建或者升级了该资源。这在未来会很有用，例如，查看在每个Deployment revision中执行了哪些命令。

然后立即执行`get`í将获得如下结果：

```shell
$ kubectl get deployments
NAME               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   3         0         0            0           1s
```

输出结果表明我们希望的repalica数是3（根据deployment中的`.spec.replicas`配置）当前replica数（ `.status.replicas`）是0, 最新的replica数（`.status.updatedReplicas`）是0，可用的replica数（`.status.availableReplicas`）是0。

过几秒后再执行`get`命令，将获得如下输出：

```shell
$ kubectl get deployments
NAME               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   3         3         3            3           18s
```

我们可以看到Deployment已经创建了3个replica，所有的replica都已经是最新的了（包含最新的pod template），可用的（根据Deployment中的`.spec.minReadySeconds`声明，处于已就绪状态的pod的最少个数）。执行`kubectl get rs`和`kubectl get pods`会显示Replica Set（RS）和Pod已创建。

```shell
$ kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-2035384211   3         3         0       18s
```

你可能会注意到Replica Set的名字总是`<Deployment的名字>-<pod template的hash值>`。

```shell
$ kubectl get pods --show-labels
NAME                                READY     STATUS    RESTARTS   AGE       LABELS
nginx-deployment-2035384211-7ci7o   1/1       Running   0          18s       app=nginx,pod-template-hash=2035384211
nginx-deployment-2035384211-kzszj   1/1       Running   0          18s       app=nginx,pod-template-hash=2035384211
nginx-deployment-2035384211-qqcnn   1/1       Running   0          18s       app=nginx,pod-template-hash=2035384211
```

刚创建的Replica Set将保证总是有3个nginx的pod存在。

**注意：** 你必须在Deployment中的selector指定正确pod template label（在该示例中是 `app = nginx`），不要跟其他的controller搞混了（包括Deployment、Replica Set、Replication Controller等）。**Kubernetes本身不会阻止你这么做**，如果你真的这么做了，这些controller之间会相互打架，并可能导致不正确的行为。

## 更新Deployment

**注意：** Deployment的rollout当且仅当Deployment的pod template（例如`.spec.template`）中的label更新或者镜像更改时被触发。其他更新，例如扩容Deployment不会触发rollout。

假如我们现在想要让nginx pod使用`nginx:1.9.1`的镜像来代替原来的`nginx:1.7.9`的镜像。

```shell
$ kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1
deployment "nginx-deployment" image updated
```

我们可以使用`edit`命令来编辑Deployment，修改 `.spec.template.spec.containers[0].image` ，将`nginx:1.7.9` 改写成 `nginx:1.9.1`。

```shell
$ kubectl edit deployment/nginx-deployment
deployment "nginx-deployment" edited
```

查看rollout的状态，只要执行：

```shell
$ kubectl rollout status deployment/nginx-deployment
Waiting for rollout to finish: 2 out of 3 new replicas have been updated...
deployment "nginx-deployment" successfully rolled out
```

Rollout成功后，`get` Deployment：

```shell
$ kubectl get deployments
NAME               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   3         3         3            3           36s
```

UP-TO-DATE的replica的数目已经达到了配置中要求的数目。

CURRENT的replica数表示Deployment管理的replica数量，AVAILABLE的replica数是当前可用的replica数量。

We can run `kubectl get rs` to see that the Deployment updated the Pods by creating a new Replica Set and scaling it up to 3 replicas, as well as scaling down the old Replica Set to 0 replicas.

我们通过执行`kubectl get rs`可以看到Deployment更新了Pod，通过创建一个新的Replica Set并扩容了3个replica，同时将原来的Replica Set缩容到了0个replica。

```shell
$ kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-1564180365   3         3         0       6s
nginx-deployment-2035384211   0         0         0       36s
```

执行 `get pods`只会看到当前的新的pod:

```shell
$ kubectl get pods
NAME                                READY     STATUS    RESTARTS   AGE
nginx-deployment-1564180365-khku8   1/1       Running   0          14s
nginx-deployment-1564180365-nacti   1/1       Running   0          14s
nginx-deployment-1564180365-z9gth   1/1       Running   0          14s
```

下次更新这些pod的时候，只需要更新Deployment中的pod的template即可。

Deployment可以保证在升级时只有一定数量的Pod是down的。默认的，它会确保至少有比期望的Pod数量少一个的Pod是up状态（最多一个不可用）。

Deployment同时也可以确保只创建出超过期望数量的一定数量的Pod。默认的，它会确保最多比期望的Pod数量多一个的Pod是up的（最多1个surge）。

**在未来的Kuberentes版本中，将从1-1变成25%-25%）。**

例如，如果你自己看下上面的Deployment，你会发现，开始创建一个新的Pod，然后删除一些旧的Pod再创建一个新的。当新的Pod创建出来之前不会杀掉旧的Pod。这样能够确保可用的Pod数量至少有2个，Pod的总数最多4个。

```shell
$ kubectl describe deployments
Name:           nginx-deployment
Namespace:      default
CreationTimestamp:  Tue, 15 Mar 2016 12:01:06 -0700
Labels:         app=nginx
Selector:       app=nginx
Replicas:       3 updated | 3 total | 3 available | 0 unavailable
StrategyType:       RollingUpdate
MinReadySeconds:    0
RollingUpdateStrategy:  1 max unavailable, 1 max surge
OldReplicaSets:     <none>
NewReplicaSet:      nginx-deployment-1564180365 (3/3 replicas created)
Events:
  FirstSeen LastSeen    Count   From                     SubobjectPath   Type        Reason              Message
  --------- --------    -----   ----                     -------------   --------    ------              -------
  36s       36s         1       {deployment-controller }                 Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-2035384211 to 3
  23s       23s         1       {deployment-controller }                 Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-1564180365 to 1
  23s       23s         1       {deployment-controller }                 Normal      ScalingReplicaSet   Scaled down replica set nginx-deployment-2035384211 to 2
  23s       23s         1       {deployment-controller }                 Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-1564180365 to 2
  21s       21s         1       {deployment-controller }                 Normal      ScalingReplicaSet   Scaled down replica set nginx-deployment-2035384211 to 0
  21s       21s         1       {deployment-controller }                 Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-1564180365 to 3
```

我们可以看到当我们刚开始创建这个Deployment的时候，创建了一个Replica Set（nginx-deployment-2035384211），并直接扩容到了3个replica。

当我们更新这个Deployment的时候，它会创建一个新的Replica Set（nginx-deployment-1564180365），将它扩容到1个replica，然后缩容原先的Replica Set到2个replica，此时满足至少2个Pod是可用状态，同一时刻最多有4个Pod处于创建的状态。

接着继续使用相同的rolling update策略扩容新的Replica Set和缩容旧的Replica Set。最终，将会在新的Replica Set中有3个可用的replica，旧的Replica Set的replica数目变成0。

### Rollover（多个rollout并行）

每当Deployment controller观测到有新的deployment被创建时，如果没有已存在的Replica Set来创建期望个数的Pod的话，就会创建出一个新的Replica Set来做这件事。已存在的Replica Set控制label匹配`.spec.selector`但是template跟`.spec.template`不匹配的Pod缩容。最终，新的Replica Set将会扩容出`.spec.replicas`指定数目的Pod，旧的Replica Set会缩容到0。

如果你更新了一个的已存在并正在进行中的Deployment，每次更新Deployment都会创建一个新的Replica Set并扩容它，同时回滚之前扩容的Replica Set——将它添加到旧的Replica Set列表，开始缩容。

例如，假如你创建了一个有5个`niginx:1.7.9` replica的Deployment，但是当还只有3个`nginx:1.7.9`的replica创建出来的时候你就开始更新含有5个`nginx:1.9.1` replica的Deployment。在这种情况下，Deployment会立即杀掉已创建的3个`nginx:1.7.9`的Pod，并开始创建`nginx:1.9.1`的Pod。它不会等到所有的5个`nginx:1.7.9`的Pod都创建完成后才开始改变航道。

## 回退Deployment

有时候你可能想回退一个Deployment，例如，当Deployment不稳定时，比如一直crash looping。

默认情况下，kubernetes会在系统中保存前两次的Deployment的rollout历史记录，以便你可以随时会退（你可以修改`revision history limit`来更改保存的revision数）。ß

**注意：**只要Deployment的rollout被触发就会创建一个revision。也就是说当且仅当Deployment的Pod template（如`.spec.template`）被更改，例如更新template中的label和容器镜像时，就会创建出一个新的revision。

其他的更新，比如扩容Deployment不会创建revision——因此我们可以很方便的手动或者自动扩容。这意味着当你回退到历史revision是，直邮Deployment中的Pod template部分才会回退。

假设我们在更新Deployment的时候犯了一个拼写错误，将镜像的名字写成了`nginx:1.91`，而正确的名字应该是`nginx:1.9.1`：

```shell
$ kubectl set image deployment/nginx-deployment nginx=nginx:1.91
deployment "nginx-deployment" image updated
```

Rollout将会卡住。

```shell
$ kubectl rollout status deployments nginx-deployment
Waiting for rollout to finish: 2 out of 3 new replicas have been updated...
```

按住Ctrl-C停止上面的rollout状态监控。

你会看到旧的replicas（nginx-deployment-1564180365 和 nginx-deployment-2035384211）和新的replicas （nginx-deployment-3066724191）数目都是2个。

```shell
$ kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-1564180365   2         2         0       25s
nginx-deployment-2035384211   0         0         0       36s
nginx-deployment-3066724191   2         2         2       6s
```

看下创建Pod，你会看到有两个新的呃Replica Set创建的Pod处于ImagePullBackOff状态，循环拉取镜像。

```shell
$ kubectl get pods
NAME                                READY     STATUS             RESTARTS   AGE
nginx-deployment-1564180365-70iae   1/1       Running            0          25s
nginx-deployment-1564180365-jbqqo   1/1       Running            0          25s
nginx-deployment-3066724191-08mng   0/1       ImagePullBackOff   0          6s
nginx-deployment-3066724191-eocby   0/1       ImagePullBackOff   0          6s
```

注意，Deployment controller会自动停止坏的rollout，并停止扩容新的Replica Set。

```shell
$ kubectl describe deployment
Name:           nginx-deployment
Namespace:      default
CreationTimestamp:  Tue, 15 Mar 2016 14:48:04 -0700
Labels:         app=nginx
Selector:       app=nginx
Replicas:       2 updated | 3 total | 2 available | 2 unavailable
StrategyType:       RollingUpdate
MinReadySeconds:    0
RollingUpdateStrategy:  1 max unavailable, 1 max surge
OldReplicaSets:     nginx-deployment-1564180365 (2/2 replicas created)
NewReplicaSet:      nginx-deployment-3066724191 (2/2 replicas created)
Events:
  FirstSeen LastSeen    Count   From                    SubobjectPath   Type        Reason              Message
  --------- --------    -----   ----                    -------------   --------    ------              -------
  1m        1m          1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-2035384211 to 3
  22s       22s         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-1564180365 to 1
  22s       22s         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled down replica set nginx-deployment-2035384211 to 2
  22s       22s         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-1564180365 to 2
  21s       21s         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled down replica set nginx-deployment-2035384211 to 0
  21s       21s         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-1564180365 to 3
  13s       13s         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-3066724191 to 1
  13s       13s         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled down replica set nginx-deployment-1564180365 to 2
  13s       13s         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-3066724191 to 2
```

为了修复这个问题，我们需要回退到稳定的Deployment revision。

### 检查Deployment升级的历史记录

首先，检查下Deployment的revision：

```shell
$ kubectl rollout history deployment/nginx-deployment
deployments "nginx-deployment":
REVISION    CHANGE-CAUSE
1           kubectl create -f docs/user-guide/nginx-deployment.yaml --record
2           kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1
3           kubectl set image deployment/nginx-deployment nginx=nginx:1.91
```

因为我们创建Deployment的时候使用了`—recored`参数可以记录命令，我们可以很方便的查看每次revison的变化。

查看单个revision的详细信息：

```shell
$ kubectl rollout history deployment/nginx-deployment --revision=2
deployments "nginx-deployment" revision 2
  Labels:       app=nginx
          pod-template-hash=1159050644
  Annotations:  kubernetes.io/change-cause=kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1
  Containers:
   nginx:
    Image:      nginx:1.9.1
    Port:       80/TCP
     QoS Tier:
        cpu:      BestEffort
        memory:   BestEffort
    Environment Variables:      <none>
  No volumes.
```

### 回退到历史版本

现在，我们可以决定回退当前的rollout到之前的版本：

```shell
$ kubectl rollout undo deployment/nginx-deployment
deployment "nginx-deployment" rolled back
```

也可以使用 `--revision`参数指定某个历史版本：

```shell
$ kubectl rollout undo deployment/nginx-deployment --to-revision=2
deployment "nginx-deployment" rolled back
```

与rollout相关的命令详细文档见[kubectl rollout](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/user-guide/kubectl/v1.6/#rollout)。

该Deployment现在已经回退到了先前的稳定版本。如你所见，Deployment controller产生了一个回退到revison 2的`DeploymentRollback`的event。

```shell
$ kubectl get deployment
NAME               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   3         3         3            3           30m

$ kubectl describe deployment
Name:           nginx-deployment
Namespace:      default
CreationTimestamp:  Tue, 15 Mar 2016 14:48:04 -0700
Labels:         app=nginx
Selector:       app=nginx
Replicas:       3 updated | 3 total | 3 available | 0 unavailable
StrategyType:       RollingUpdate
MinReadySeconds:    0
RollingUpdateStrategy:  1 max unavailable, 1 max surge
OldReplicaSets:     <none>
NewReplicaSet:      nginx-deployment-1564180365 (3/3 replicas created)
Events:
  FirstSeen LastSeen    Count   From                    SubobjectPath   Type        Reason              Message
  --------- --------    -----   ----                    -------------   --------    ------              -------
  30m       30m         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-2035384211 to 3
  29m       29m         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-1564180365 to 1
  29m       29m         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled down replica set nginx-deployment-2035384211 to 2
  29m       29m         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-1564180365 to 2
  29m       29m         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled down replica set nginx-deployment-2035384211 to 0
  29m       29m         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-3066724191 to 2
  29m       29m         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-3066724191 to 1
  29m       29m         1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled down replica set nginx-deployment-1564180365 to 2
  2m        2m          1       {deployment-controller }                Normal      ScalingReplicaSet   Scaled down replica set nginx-deployment-3066724191 to 0
  2m        2m          1       {deployment-controller }                Normal      DeploymentRollback  Rolled back deployment "nginx-deployment" to revision 2
  29m       2m          2       {deployment-controller }                Normal      ScalingReplicaSet   Scaled up replica set nginx-deployment-1564180365 to 3
```

### 清理Policy

你可以通过设置`.spec.revisonHistoryLimit`项来指定deployment最多保留多少revison历史记录。默认的会保留所有的revision；如果将该项设置为0，Deployment就不允许回退了。

## Deployment扩容

你可以使用以下命令扩容Deployment：

```shell
$ kubectl scale deployment nginx-deployment --replicas 10
deployment "nginx-deployment" scaled
```

假设你的集群中启用了[horizontal pod autoscaling](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough)，你可以给Deployment设置一个autoscaler，基于当前Pod的CPU利用率选择最少和最多的Pod数。

```shell
$ kubectl autoscale deployment nginx-deployment --min=10 --max=15 --cpu-percent=80
deployment "nginx-deployment" autoscaled
```

## 比例扩容

RollingUpdate Deployment支持同时运行一个应用的多个版本。当你活着autoscaler扩容RollingUpdate Deployment的时候，正在中途的rollout（进行中或者已经暂停的），为了降低风险，Deployment controller将会平衡已存在的活动中的ReplicaSets（有Pod的ReplicaSets）和新加入的replicas。这被称为比例扩容。

例如，你正在运行中含有10个replica的Deployment。maxSurge=3，maxUnavailable=2。

```shell
$ kubectl get deploy
NAME                 DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment     10        10        10           10          50s
```

你更新了一个镜像，而在集群内部无法解析。

```shell
$ kubectl set image deploy/nginx-deployment nginx=nginx:sometag
deployment "nginx-deployment" image updated
```

镜像更新启动了一个包含ReplicaSet nginx-deployment-1989198191的新的rollout，但是它被阻塞了，因为我们上面提到的maxUnavailable。

```shell
$ kubectl get rs
NAME                          DESIRED   CURRENT   READY     AGE
nginx-deployment-1989198191   5         5         0         9s
nginx-deployment-618515232    8         8         8         1m
```

然后发起了一个新的Deployment扩容请求。autoscaler将Deployment的repllica数目增加到了15个。Deployment controller需要判断在哪里增加这5个新的replica。如果我们没有谁用比例扩容，所有的5个replica都会加到一个新的ReplicaSet中。如果使用比例扩容，新添加的replica将传播到所有的ReplicaSet中。大的部分加入replica数最多的ReplicaSet中，小的部分加入到replica数少的ReplciaSet中。0个replica的ReplicaSet不会被扩容。

在我们上面的例子中，3个replica将添加到旧的ReplicaSet中，2个replica将添加到新的ReplicaSet中。rollout进程最终会将所有的replica移动到新的ReplicaSet中，假设新的replica成为健康状态。

```shell
$ kubectl get deploy
NAME                 DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment     15        18        7            8           7m
$ kubectl get rs
NAME                          DESIRED   CURRENT   READY     AGE
nginx-deployment-1989198191   7         7         0         7m
nginx-deployment-618515232    11        11        11        7m
```

## 暂停和恢复Deployment

你可以在出发一次或多次更新前暂停一个Deployment，然后再恢复它。这样你就能多次暂停和恢复Deployment，在此期间进行一些修复工作，而不会出发不必要的rollout。

例如使用刚刚创建Deployment：

```shell
$ kubectl get deploy
NAME      DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx     3         3         3            3           1m
[mkargaki@dhcp129-211 kubernetes]$ kubectl get rs
NAME               DESIRED   CURRENT   READY     AGE
nginx-2142116321   3         3         3         1m
```

使用以下命令暂停Deployment：

```shell
$ kubectl rollout pause deployment/nginx-deployment
deployment "nginx-deployment" paused
```

然后更新Deplyment中的镜像：

```shell
$ kubectl set image deploy/nginx nginx=nginx:1.9.1
deployment "nginx-deployment" image updated
```

注意新的rollout启动了：

```shell
$ kubectl rollout history deploy/nginx
deployments "nginx"
REVISION  CHANGE-CAUSE
1   <none>

$ kubectl get rs
NAME               DESIRED   CURRENT   READY     AGE
nginx-2142116321   3         3         3         2m
```

你可以进行任意多次更新，例如更新使用的资源：

```shell
$ kubectl set resources deployment nginx -c=nginx --limits=cpu=200m,memory=512Mi
deployment "nginx" resource requirements updated
```

Deployment暂停前的初始状态将继续它的功能，而不会对Deployment的更新产生任何影响，只要Deployment是暂停的。

最后，恢复这个Deployment，观察完成更新的ReplicaSet已经创建出来了：

```shell
$ kubectl rollout resume deploy nginx
deployment "nginx" resumed
$ KUBECTL get rs -w
NAME               DESIRED   CURRENT   READY     AGE
nginx-2142116321   2         2         2         2m
nginx-3926361531   2         2         0         6s
nginx-3926361531   2         2         1         18s
nginx-2142116321   1         2         2         2m
nginx-2142116321   1         2         2         2m
nginx-3926361531   3         2         1         18s
nginx-3926361531   3         2         1         18s
nginx-2142116321   1         1         1         2m
nginx-3926361531   3         3         1         18s
nginx-3926361531   3         3         2         19s
nginx-2142116321   0         1         1         2m
nginx-2142116321   0         1         1         2m
nginx-2142116321   0         0         0         2m
nginx-3926361531   3         3         3         20s
^C
$ KUBECTL get rs
NAME               DESIRED   CURRENT   READY     AGE
nginx-2142116321   0         0         0         2m
nginx-3926361531   3         3         3         28s
```

**注意：**在恢复Deployment之前你无法回退一个暂停了个Deployment。

## Deployment状态

Deployment在生命周期中有多种状态。在创建一个新的ReplicaSet的时候它可以是 [progressing](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/concepts/workloads/controllers/deployment.md#progressing-deployment) 状态， [complete](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/concepts/workloads/controllers/deployment.md#complete-deployment) 状态，或者[fail to progress](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/concepts/workloads/controllers/deployment.md#failed-deployment)状态。

### Progressing Deployment

Kubernetes将执行过下列任务之一的Deployment标记为*progressing*状态：

- Deployment正在创建新的ReplicaSet过程中。
- Deployment正在扩容一个已有的ReplicaSet。
- Deployment正在缩容一个已有的ReplicaSet。
- 有新的可用的pod出现。

你可以使用`kubectl roullout status`命令监控Deployment的进度。

### Complete Deployment

Kubernetes将包括以下特性的Deployment标记为*complete*状态：

- Deployment最小可用。最小可用意味着Deployment的可用replica个数等于或者超过Deployment策略中的期望个数。
- 所有与该Deployment相关的replica都被更新到了你指定版本，也就说更新完成。
- 该Deployment中没有旧的Pod存在。

你可以用`kubectl rollout status`命令查看Deployment是否完成。如果rollout成功完成，`kubectl rollout status`将返回一个0值的Exit Code。

```bash
$ kubectl rollout status deploy/nginx
Waiting for rollout to finish: 2 of 3 updated replicas are available...
deployment "nginx" successfully rolled out
$ echo $?
0
```

### Failed Deployment

你的Deployment在尝试部署新的ReplicaSet的时候可能卡住，用于也不会完成。这可能是因为以下几个因素引起的：

- 无效的引用
- 不可读的probe failure
- 镜像拉取错误
- 权限不够
- 范围限制
- 程序运行时配置错误

探测这种情况的一种方式是，在你的Deployment spec中指定[`spec.progressDeadlineSeconds`](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/concepts/workloads/controllers/deployment.md#progress-deadline-seconds)。`spec.progressDeadlineSeconds` 表示Deployment controller等待多少秒才能确定（通过Deployment status）Deployment进程是卡住的。

下面的`kubectl`命令设置`progressDeadlineSeconds` 使controller在Deployment在进度卡住10分钟后报告：

```bash
$ kubectl patch deployment/nginx-deployment -p '{"spec":{"progressDeadlineSeconds":600}}'
"nginx-deployment" patched
```

Once the deadline has been exceeded, the Deployment controller adds a  with the following attributes to the Deployment's

当超过截止时间后，Deployment controller会在Deployment的 `status.conditions`中增加一条DeploymentCondition，它包括如下属性：

- Type=Progressing
- Status=False
- Reason=ProgressDeadlineExceeded

浏览 [Kubernetes API conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/api-conventions.md#typical-status-properties) 查看关于status conditions的更多信息。

**注意：**kubernetes除了报告`Reason=ProgressDeadlineExceeded`状态信息外不会对卡住的Deployment做任何操作。更高层次的协调器可以利用它并采取相应行动，例如，回滚Deployment到之前的版本。

**注意：**如果你暂停了一个Deployment，在暂停的这段时间内kubernetnes不会检查你指定的deadline。你可以在Deployment的rollout途中安全的暂停它，然后再恢复它，这不会触发超过deadline的状态。

你可能在使用Deployment的时候遇到一些短暂的错误，这些可能是由于你设置了太短的timeout，也有可能是因为各种其他错误导致的短暂错误。例如，假设你使用了无效的引用。当你Describe Deployment的时候可能会注意到如下信息：

```bash
$ kubectl describe deployment nginx-deployment
<...>
Conditions:
  Type            Status  Reason
  ----            ------  ------
  Available       True    MinimumReplicasAvailable
  Progressing     True    ReplicaSetUpdated
  ReplicaFailure  True    FailedCreate
<...>
```

执行 `kubectl get deployment nginx-deployment -o yaml`，Deployement 的状态可能看起来像这个样子：

```yaml
status:
  availableReplicas: 2
  conditions:
  - lastTransitionTime: 2016-10-04T12:25:39Z
    lastUpdateTime: 2016-10-04T12:25:39Z
    message: Replica set "nginx-deployment-4262182780" is progressing.
    reason: ReplicaSetUpdated
    status: "True"
    type: Progressing
  - lastTransitionTime: 2016-10-04T12:25:42Z
    lastUpdateTime: 2016-10-04T12:25:42Z
    message: Deployment has minimum availability.
    reason: MinimumReplicasAvailable
    status: "True"
    type: Available
  - lastTransitionTime: 2016-10-04T12:25:39Z
    lastUpdateTime: 2016-10-04T12:25:39Z
    message: 'Error creating: pods "nginx-deployment-4262182780-" is forbidden: exceeded quota:
      object-counts, requested: pods=1, used: pods=3, limited: pods=2'
    reason: FailedCreate
    status: "True"
    type: ReplicaFailure
  observedGeneration: 3
  replicas: 2
  unavailableReplicas: 2
```

最终，一旦超过Deployment进程的deadline，kuberentes会更新状态和导致Progressing状态的原因：

```Bash
Conditions:
  Type            Status  Reason
  ----            ------  ------
  Available       True    MinimumReplicasAvailable
  Progressing     False   ProgressDeadlineExceeded
  ReplicaFailure  True    FailedCreate
```

你可以通过缩容Deployment的方式解决配额不足的问题，或者增加你的namespace的配额。如果你满足了配额条件后，Deployment controller就会完成你的Deployment rollout，你将看到Deployment的状态更新为成功状态（`Status=True`并且`Reason=NewReplicaSetAvailable`）。

```bash
Conditions:
  Type          Status  Reason
  ----          ------  ------
  Available     True    MinimumReplicasAvailable
  Progressing   True    NewReplicaSetAvailable
```

`Type=Available`、 `Status=True` 以为这你的Deployment有最小可用性。 最小可用性是在Deployment策略中指定的参数。`Type=Progressing` 、 `Status=True`意味着你的Deployment 或者在部署过程中，或者已经成功部署，达到了期望的最少的可用replica数量（查看特定状态的Reason——在我们的例子中`Reason=NewReplicaSetAvailable` 意味着Deployment已经完成）。

你可以使用`kubectl rollout status`命令查看Deployment进程是否失败。当Deployment过程超过了deadline，`kubectl rollout status`将返回非0的exit code。

```bash
$ kubectl rollout status deploy/nginx
Waiting for rollout to finish: 2 out of 3 new replicas have been updated...
error: deployment "nginx" exceeded its progress deadline
$ echo $?
1
```

### 操作失败的Deployment

所有对完成的Deployment的操作都适用于失败的Deployment。你可以对它阔／缩容，回退到历史版本，你甚至可以多次暂停它来应用Deployment pod template。

## 清理Policy

你可以设置Deployment中的 `.spec.revisionHistoryLimit` 项来指定保留多少旧的ReplicaSet。 余下的将在后台被当作垃圾收集。默认的，所有的revision历史就都会被保留。在未来的版本中，将会更改为2。

**注意：**将该值设置为0，将导致所有的Deployment历史记录都会被清除，该Deploynent就无法再回退了。

## 用例

### 金丝雀Deployment

如果你想要使用Deployment对部分用户或服务器发布relaese，你可以创建多个Deployment，每个对一个release，参照[managing resources](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/concepts/cluster-administration/manage-deployment/#canary-deployments) 中对金丝雀模式的描述。

## 编写Deployment Spec

在所有的Kubernetes配置中，Deployment也需要`apiVersion`，`kind`和`metadata`这些配置项。配置文件的通用使用说明查看[部署应用](https://kubernetes.io/docs/tutorials/stateless-application/run-stateless-application-deployment)，配置容器，和[使用kubeclt管理资源](https://kubernetes.io/docs/tutorials/object-management-kubectl/object-management)文档。

Deployment也需要 [`.spec` section](https://github.com/kubernetes/community/blob/master/contributors/devel/api-conventions.md#spec-and-status).

### Pod Template

 `.spec.template` 是 `.spec`中唯一要求的字段。

`.spec.template` 是 [pod template](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/user-guide/replication-controller/#pod-template). 它跟 [Pod](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/user-guide/pods)有一模一样的schema，除了它是嵌套的并且不需要`apiVersion` 和 `kind`字段。

另外为了划分Pod的范围，Deployment中的pod template必须指定适当的label（不要跟其他controller重复了，参考[selector](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/concepts/workloads/controllers/deployment.md#selector)）和适当的重启策略。

[`.spec.template.spec.restartPolicy`](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/concepts/workloads/pods/pod-lifecycle) 可以设置为 `Always` , 如果不指定的话这就是默认配置。

### Replicas

`.spec.replicas` 是可以选字段，指定期望的pod数量，默认是1。

### Selector

`.spec.selector`是可选字段，用来指定 [label selector](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/concepts/overview/working-with-objects/labels) ，圈定Deployment管理的pod范围。

如果被指定， `.spec.selector` 必须匹配 `.spec.template.metadata.labels`，否则它将被API拒绝。如果 `.spec.selector` 没有被指定， `.spec.selector.matchLabels` 默认是 `.spec.template.metadata.labels`。

在Pod的template跟`.spec.template`不同或者数量超过了`.spec.replicas`规定的数量的情况下，Deployment会杀掉label跟selector不同的Pod。

**注意：**你不应该再创建其他label跟这个selector匹配的pod，或者通过其他Deployment，或者通过其他Controller，例如ReplicaSet和ReplicationController。否则该Deployment会被把它们当成都是自己创建的。Kubernetes不会阻止你这么做。

如果你有多个controller使用了重复的selector，controller们就会互相打架并导致不正确的行为。

### 策略

`.spec.strategy` 指定新的Pod替换旧的Pod的策略。 `.spec.strategy.type` 可以是"Recreate"或者是 "RollingUpdate"。"RollingUpdate"是默认值。

#### Recreate Deployment

`.spec.strategy.type==Recreate`时，在创建出新的Pod之前会先杀掉所有已存在的Pod。

#### Rolling Update Deployment

`.spec.strategy.type==RollingUpdate`时，Deployment使用[rolling update](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/tasks/run-application/rolling-update-replication-controller) 的方式更新Pod 。你可以指定`maxUnavailable` 和 `maxSurge` 来控制 rolling update 进程。

##### Max Unavailable

`.spec.strategy.rollingUpdate.maxUnavailable` 是可选配置项，用来指定在升级过程中不可用Pod的最大数量。该值可以是一个绝对值（例如5），也可以是期望Pod数量的百分比（例如10%）。通过计算百分比的绝对值向下取整。如果`.spec.strategy.rollingUpdate.maxSurge` 为0时，这个值不可以为0。默认值是1。

例如，该值设置成30%，启动rolling update后旧的ReplicatSet将会立即缩容到期望的Pod数量的70%。新的Pod ready后，随着新的ReplicaSet的扩容，旧的ReplicaSet会进一步缩容，确保在升级的所有时刻可以用的Pod数量至少是期望Pod数量的70%。

##### Max Surge

`.spec.strategy.rollingUpdate.maxSurge` 是可选配置项，用来指定可以超过期望的Pod数量的最大个数。该值可以是一个绝对值（例如5）或者是期望的Pod数量的百分比（例如10%）。当`MaxUnavailable`为0时该值不可以为0。通过百分比计算的绝对值向上取整。默认值是1。

例如，该值设置成30%，启动rolling update后新的ReplicatSet将会立即扩容，新老Pod的总数不能超过期望的Pod数量的130%。旧的Pod被杀掉后，新的ReplicaSet将继续扩容，旧的ReplicaSet会进一步缩容，确保在升级的所有时刻所有的Pod数量和不会超过期望Pod数量的130%。

### Progress Deadline Seconds

`.spec.progressDeadlineSeconds` 是可选配置项，用来指定在系统报告Deployment的[failed progressing](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/concepts/workloads/controllers/deployment.md#failed-deployment) ——表现为resource的状态中`type=Progressing`、`Status=False`、 `Reason=ProgressDeadlineExceeded`前可以等待的Deployment进行的秒数。Deployment controller会继续重试该Deployment。未来，在实现了自动回滚后， deployment controller在观察到这种状态时就会自动回滚。

如果设置该参数，该值必须大于 `.spec.minReadySeconds`。

### Min Ready Seconds

`.spec.minReadySeconds`是一个可选配置项，用来指定没有任何容器crash的Pod并被认为是可用状态的最小秒数。默认是0（Pod在ready后就会被认为是可用状态）。进一步了解什么什么后Pod会被认为是ready状态，参阅 [Container Probes](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/concepts/workloads/pods/pod-lifecycle/#container-probes)。

### Rollback To

`.spec.rollbackTo` 是一个可以选配置项，用来配置Deployment回退的配置。设置该参数将触发回退操作，每次回退完成后，该值就会被清除。

#### Revision

`.spec.rollbackTo.revision`是一个可选配置项，用来指定回退到的revision。默认是0，意味着回退到历史中最老的revision。

### Revision History Limit

Deployment revision history存储在它控制的ReplicaSets中。

`.spec.revisionHistoryLimit` 是一个可选配置项，用来指定可以保留的旧的ReplicaSet数量。该理想值取决于心Deployment的频率和稳定性。如果该值没有设置的话，默认所有旧的Replicaset或会被保留，将资源存储在etcd中，是用`kubectl get rs`查看输出。每个Deployment的该配置都保存在ReplicaSet中，然而，一旦你删除的旧的RepelicaSet，你的Deployment就无法再回退到那个revison了。

如果你将该值设置为0，所有具有0个replica的ReplicaSet都会被删除。在这种情况下，新的Deployment rollout无法撤销，因为revision history都被清理掉了。

### Paused

`.spec.paused`是可以可选配置项，boolean值。用来指定暂停和恢复Deployment。Paused和没有paused的Deployment之间的唯一区别就是，所有对paused deployment中的PodTemplateSpec的修改都不会触发新的rollout。Deployment被创建之后默认是非paused。

## Alternative to Deployments

### kubectl rolling update

[Kubectl rolling update](https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/user-guide/kubectl/v1.6/#rolling-update) 虽然使用类似的方式更新Pod和ReplicationController。但是我们推荐使用Deployment，因为它是声明式的，客户端侧，具有附加特性，例如及时滚动升级结束后也可以回滚到任何历史版本。
