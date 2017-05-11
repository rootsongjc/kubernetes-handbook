# Deployment概念解析

本文翻译自kubernetes官方文档：https://github.com/kubernetes/kubernetes.github.io/blob/master/docs/concepts/workloads/controllers/deployment.md

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
- 清楚旧的不必要的ReplicaSet。

## 创建

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


## 更新

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

Deployment可以保证在升级时只有一定数量的Pod是down的。默认的，它会确保至少有比需求的Pod数量少一个的Pod是up状态（最多一个不可用）。

Deployment同时也可以确保只创建出超过需求数量的一定数量的Pod。默认的，它会确保最多比需求的Pod数量多一个的Pod是up的（最多1个surge）。

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

每当Deployment controller观测到有新的deployment被创建时，如果没有已存在的Replica Set来创建需求个数的Pod的话，就会创建出一个新的Replica Set来做这件事。已存在的Replica Set控制label匹配`.spec.selector`但是template跟`.spec.template`不匹配的Pod缩容。最终，新的Replica Set将会扩容出`.spec.replicas`指定数目的Pod，旧的Replica Set会缩容到0。

如果你更新了一个的已存在并正在进行中的Deployment，每次更新Deployment都会创建一个新的Replica Set并扩容它，同时回滚之前扩容的Replica Set——将它添加到旧的Replica Set列表，开始缩容。

例如，假如你创建了一个有5个`niginx:1.7.9` replica的Deployment，但是当还只有3个`nginx:1.7.9`的replica创建出来的时候你就开始更新含有5个`nginx:1.9.1` replica的Deployment。在这种情况下，Deployment会立即杀掉已创建的3个`nginx:1.7.9`的Pod，并开始创建`nginx:1.9.1`的Pod。它不会等到所有的5个`nginx:1.7.9`的Pod都创建完成后才开始改变航道。

## 回退

有时候你可能想回退一个Deployment，例如，当Deployment不稳定时，比如一直crash looping。

By default, two previous Deployment's rollout history are kept in the system so that you can rollback anytime you want
(you can change that by modifying [revision history limit](/docs/user-guide/deployments/#revision-history-limit)).

**Note:** a Deployment's revision is created when a Deployment's rollout is triggered. This means that the new revision is created
if and only if the Deployment's pod template (i.e. `.spec.template`) is changed, e.g. updating labels or container images of the template.
Other updates, such as scaling the Deployment, will not create a Deployment revision -- so that we can facilitate simultaneous manual- or
auto-scaling. This implies that when you rollback to an earlier revision, only the Deployment's pod template part will be rolled back.

Suppose that we made a typo while updating the Deployment, by putting the image name as `nginx:1.91` instead of `nginx:1.9.1`:

```shell
$ kubectl set image deployment/nginx-deployment nginx=nginx:1.91
deployment "nginx-deployment" image updated
```

Rollout将会卡住。

```shell
$ kubectl rollout status deployments nginx-deployment
Waiting for rollout to finish: 2 out of 3 new replicas have been updated...
```

Press Ctrl-C to stop the above rollout status watch. For more information on stuck rollouts, [read more here](#deployment-status).

You will also see that both the number of old replicas (nginx-deployment-1564180365 and nginx-deployment-2035384211) and new replicas (nginx-deployment-3066724191) are 2.

```shell
$ kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-1564180365   2         2         0       25s
nginx-deployment-2035384211   0         0         0       36s
nginx-deployment-3066724191   2         2         2       6s
```

Looking at the Pods created, you will see that the 2 Pods created by new Replica Set are stuck in an image pull loop.

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

First, check the revisions of this deployment:

```shell
$ kubectl rollout history deployment/nginx-deployment
deployments "nginx-deployment":
REVISION    CHANGE-CAUSE
1           kubectl create -f docs/user-guide/nginx-deployment.yaml --record
2           kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1
3           kubectl set image deployment/nginx-deployment nginx=nginx:1.91
```

Because we recorded the command while creating this Deployment using `--record`, we can easily see the changes we made in each revision.

To further see the details of each revision, run:

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

Now we've decided to undo the current rollout and rollback to the previous revision:

```shell
$ kubectl rollout undo deployment/nginx-deployment
deployment "nginx-deployment" rolled back
```

Alternatively, you can rollback to a specific revision by specify that in `--to-revision`:

```shell
$ kubectl rollout undo deployment/nginx-deployment --to-revision=2
deployment "nginx-deployment" rolled back
```

For more details about rollout related commands, read [`kubectl rollout`](/docs/user-guide/kubectl/v1.6/#rollout).

The Deployment is now rolled back to a previous stable revision. As you can see, a `DeploymentRollback` event for rolling back to revision 2 is generated from Deployment controller.

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

You can set `.spec.revisionHistoryLimit` field to specify how much revision history of this deployment you want to keep. By default,
all revision history will be kept; explicitly setting this field to `0` disallows a deployment being rolled back.

## 扩容Deployment

You can scale a Deployment by using the following command:

```shell
$ kubectl scale deployment nginx-deployment --replicas 10
deployment "nginx-deployment" scaled
```

Assuming [horizontal pod autoscaling](/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/) is enabled
in your cluster, you can setup an autoscaler for your Deployment and choose the minimum and maximum number of
Pods you want to run based on the CPU utilization of your existing Pods.

```shell
$ kubectl autoscale deployment nginx-deployment --min=10 --max=15 --cpu-percent=80
deployment "nginx-deployment" autoscaled
```

RollingUpdate Deployments support running multiple versions of an application at the same time. When you
or an autoscaler scales a RollingUpdate Deployment that is in the middle of a rollout (either in progress
or paused), then the Deployment controller will balance the additional replicas in the existing active
ReplicaSets (ReplicaSets with Pods) in order to mitigate risk. This is called *proportional scaling*.

For example, you are running a Deployment with 10 replicas, [maxSurge](#max-surge)=3, and [maxUnavailable](#max-unavailable)=2.

```shell
$ kubectl get deploy
NAME                 DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment     10        10        10           10          50s
```

You update to a new image which happens to be unresolvable from inside the cluster.

```shell
$ kubectl set image deploy/nginx-deployment nginx=nginx:sometag
deployment "nginx-deployment" image updated
```

The image update starts a new rollout with ReplicaSet nginx-deployment-1989198191 but it's blocked due to the
maxUnavailable requirement that we mentioned above.

```shell
$ kubectl get rs
NAME                          DESIRED   CURRENT   READY     AGE
nginx-deployment-1989198191   5         5         0         9s
nginx-deployment-618515232    8         8         8         1m
```

Then a new scaling request for the Deployment comes along. The autoscaler increments the Deployment replicas
to 15. The Deployment controller needs to decide where to add these new 5 replicas. If we weren't using
proportional scaling, all 5 of them would be added in the new ReplicaSet. With proportional scaling, we
spread the additional replicas across all ReplicaSets. Bigger proportions go to the ReplicaSets with the
most replicas and lower proportions go to ReplicaSets with less replicas. Any leftovers are added to the
ReplicaSet with the most replicas. ReplicaSets with zero replicas are not scaled up.

In our example above, 3 replicas will be added to the old ReplicaSet and 2 replicas will be added to the
new ReplicaSet. The rollout process should eventually move all replicas to the new ReplicaSet, assuming
the new replicas become healthy.

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

You can also pause a Deployment mid-way and then resume it. A use case is to support canary deployment.

Update the Deployment again and then pause the Deployment with `kubectl rollout pause`:

```shell
$ kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1; kubectl rollout pause deployment/nginx-deployment
deployment "nginx-deployment" image updated
deployment "nginx-deployment" paused
```

Note that any current state of the Deployment will continue its function, but new updates to the Deployment will not have an effect as long as the Deployment is paused.

The Deployment was still in progress when we paused it, so the actions of scaling up and down Replica Sets are paused too.

```shell
$ kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-1564180365   2         2         2       1h
nginx-deployment-2035384211   2         2         0       1h
nginx-deployment-3066724191   0         0         0       1h
```

In a separate terminal, watch for rollout status changes and you'll see the rollout won't continue:

```shell
$ kubectl rollout status deployment/nginx-deployment
Waiting for rollout to finish: 2 out of 3 new replicas have been updated...
```

To resume the Deployment, simply do `kubectl rollout resume`:

```shell
$ kubectl rollout resume deployment/nginx-deployment
deployment "nginx-deployment" resumed
```

Then the Deployment will continue and finish the rollout:

```shell
$ kubectl rollout status deployment/nginx-deployment
Waiting for rollout to finish: 2 out of 3 new replicas have been updated...
Waiting for deployment spec update to be observed...
Waiting for rollout to finish: 2 out of 3 new replicas have been updated...
deployment nginx-deployment successfully rolled out
```

```shell
$ kubectl get rs
NAME                          DESIRED   CURRENT   READY   AGE
nginx-deployment-1564180365   3         3         3       1h
nginx-deployment-2035384211   0         0         0       1h
nginx-deployment-3066724191   0         0         0       1h
```

Note: You cannot rollback a paused Deployment until you resume it.


## Deployment状态

A Deployment enters various states during its lifecycle. It can be [progressing](#progressing-deployment) while rolling out a new ReplicaSet,
it can be [complete](#complete-deployment), or it can [fail to progress](#failed-deployment).

### Progressing Deployment

Kubernetes marks a Deployment as _progressing_ when one of the following tasks is performed:

* The Deployment is in the process of creating a new ReplicaSet.
* The Deployment is scaling up an existing ReplicaSet.
* The Deployment is scaling down an existing ReplicaSet.
* New pods become available.

You can monitor the progress for a Deployment by using `kubectl rollout status`.

### Complete Deployment

Kubernetes marks a Deployment as _complete_ when it has the following characteristics:

* The Deployment has minimum availability. Minimum availability means that the Deployment's number of available replicas
  equals or exceeds the number required by the Deployment strategy.
* All of the replicas associated with the Deployment have been updated to the latest version you've specified, meaning any
  updates you've requested have been completed.
* No old pods for the Deployment are running.

You can check if a Deployment has completed by using `kubectl rollout status`. If the rollout completed successfully, `kubectl rollout status` returns a zero exit code.

```shell
$ kubectl rollout status deploy/nginx
Waiting for rollout to finish: 2 of 3 updated replicas are available...
deployment "nginx" successfully rolled out
$ echo $?
0
```

### Failed Deployment

Your Deployment may get stuck trying to deploy its newest ReplicaSet without ever completing. This can occur due to some of the following factors:

* Insufficient quota
* Readiness probe failures
* Image pull errors
* Insufficient permissions
* Limit ranges
* Application runtime misconfiguration

One way you can detect this condition is to specify a deadline parameter in your Deployment spec: ([`spec.progressDeadlineSeconds`](#progress-deadline-seconds)). `spec.progressDeadlineSeconds` denotes the number of seconds the Deployment controller waits before indicating (via the Deployment status) that the Deployment progress has stalled.

The following `kubectl` command sets the spec with `progressDeadlineSeconds` to make the controller report lack of progress for a Deployment after 10 minutes:

```shell
$ kubectl patch deployment/nginx-deployment -p '{"spec":{"progressDeadlineSeconds":600}}'
"nginx-deployment" patched
```
Once the deadline has been exceeded, the Deployment controller adds a DeploymentCondition with the following attributes to
the Deployment's `status.conditions`:

* Type=Progressing
* Status=False
* Reason=ProgressDeadlineExceeded

See the [Kubernetes API conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/api-conventions.md#typical-status-properties) for more information on status conditions.

Note that in version 1.5, Kubernetes will take no action on a stalled Deployment other than to report a status condition with
`Reason=ProgressDeadlineExceeded`.

**Note:** If you pause a Deployment, Kubernetes does not check progress against your specified deadline. You can safely pause a Deployment in the middle of a rollout and resume without triggering the condition for exceeding the deadline.

You may experience transient errors with your Deployments, either due to a low timeout that you have set or due to any other kind
of error that can be treated as transient. For example, let's suppose you have insufficient quota. If you describe the Deployment
you will notice the following section:

```shell
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

If you run `kubectl get deployment nginx-deployment -o yaml`, the Deployement status might look like this:

```
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

Eventually, once the Deployment progress deadline is exceeded, Kubernetes updates the status and the reason for the Progressing condition:

```
Conditions:
  Type            Status  Reason
  ----            ------  ------
  Available       True    MinimumReplicasAvailable
  Progressing     False   ProgressDeadlineExceeded
  ReplicaFailure  True    FailedCreate
```

You can address an issue of insufficient quota by scaling down your Deployment, by scaling down other controllers you may be running,
or by increasing quota in your namespace. If you satisfy the quota conditions and the Deployment controller then completes the Deployment
rollout, you'll see the Deployment's status update with a successful condition (`Status=True` and `Reason=NewReplicaSetAvailable`).

```
Conditions:
  Type          Status  Reason
  ----          ------  ------
  Available     True    MinimumReplicasAvailable
  Progressing   True    NewReplicaSetAvailable
```

`Type=Available` with `Status=True` means that your Deployment has minimum availability. Minimum availability is dictated
by the parameters specified in the deployment strategy. `Type=Progressing` with `Status=True` means that your Deployment
is either in the middle of a rollout and it is progressing or that it has successfully completed its progress and the minimum
required new replicas are available (see the Reason of the condition for the particulars - in our case
`Reason=NewReplicaSetAvailable` means that the Deployment is complete).

You can check if a Deployment has failed to progress by using `kubectl rollout status`. `kubectl rollout status` returns a non-zero exit code if the Deployment has exceeded the progression deadline.

```shell
$ kubectl rollout status deploy/nginx
Waiting for rollout to finish: 2 out of 3 new replicas have been updated...
error: deployment "nginx" exceeded its progress deadline
$ echo $?
1
```

### Operating on a failed deployment

All actions that apply to a complete Deployment also apply to a failed Deployment. You can scale it up/down, roll back
to a previous revision, or even pause it if you need to apply multiple tweaks in the Deployment pod template.

## 用例

### Canary Deployment

If you want to roll out releases to a subset of users or servers using the Deployment, you can create multiple Deployments, one for each release,
following the canary pattern described in [managing resources](/docs/concepts/cluster-administration/manage-deployment/#canary-deployments).

## Writing a Deployment Spec

As with all other Kubernetes configs, a Deployment needs `apiVersion`, `kind`, and
`metadata` fields.  For general information about working with config files,
see [deploying applications](/docs/user-guide/deploying-applications), [configuring containers](/docs/user-guide/configuring-containers), and [using kubectl to manage resources](/docs/user-guide/working-with-resources) documents.

A Deployment also needs a [`.spec` section](https://github.com/kubernetes/community/blob/master/contributors/devel/api-conventions.md#spec-and-status).

### Pod Template

The `.spec.template` is the only required field of the `.spec`.

The `.spec.template` is a [pod template](/docs/user-guide/replication-controller/#pod-template).  It has exactly
the same schema as a [Pod](/docs/user-guide/pods), except it is nested and does not have an
`apiVersion` or `kind`.

In addition to required fields for a Pod, a pod template in a Deployment must specify appropriate
labels (i.e. don't overlap with other controllers, see [selector](#selector)) and an appropriate restart policy.

Only a [`.spec.template.spec.restartPolicy`](/docs/user-guide/pod-states/) equal to `Always` is allowed, which is the default
if not specified.

### Replicas

`.spec.replicas` is an optional field that specifies the number of desired Pods. It defaults
to 1.

### Selector

`.spec.selector` is an optional field that specifies a [label selector](/docs/user-guide/labels/#label-selectors) for the Pods
targeted by this deployment.

If specified, `.spec.selector` must match `.spec.template.metadata.labels`, or it will
be rejected by the API.  If `.spec.selector` is unspecified, `.spec.selector.matchLabels` will be defaulted to
`.spec.template.metadata.labels`.

Deployment may kill Pods whose labels match the selector, in the case that their
template is different than `.spec.template` or if the total number of such Pods
exceeds `.spec.replicas`. It will bring up new Pods with `.spec.template` if
number of Pods are less than the desired number.

Note that you should not create other pods whose labels match this selector, either directly, via another Deployment or via another controller such as Replica Sets or Replication Controllers. Otherwise, the Deployment will think that those pods were created by it. Kubernetes will not stop you from doing this.

If you have multiple controllers that have overlapping selectors, the controllers will fight with each other's and won't behave correctly.

### Strategy

`.spec.strategy` specifies the strategy used to replace old Pods by new ones.
`.spec.strategy.type` can be "Recreate" or "RollingUpdate". "RollingUpdate" is
the default value.

#### Recreate Deployment

All existing Pods are killed before new ones are created when
`.spec.strategy.type==Recreate`.

#### Rolling Update Deployment

The Deployment updates Pods in a [rolling update](/docs/tasks/run-application/rolling-update-replication-controller/) fashion
when `.spec.strategy.type==RollingUpdate`.
You can specify `maxUnavailable` and `maxSurge` to control
the rolling update process.

##### Max Unavailable

`.spec.strategy.rollingUpdate.maxUnavailable` is an optional field that specifies the
maximum number of Pods that can be unavailable during the update process.
The value can be an absolute number (e.g. 5) or a percentage of desired Pods
(e.g. 10%).
The absolute number is calculated from percentage by rounding up.
This can not be 0 if `.spec.strategy.rollingUpdate.maxSurge` is 0.
By default, a fixed value of 1 is used.

For example, when this value is set to 30%, the old Replica Set can be scaled down to
70% of desired Pods immediately when the rolling update starts. Once new Pods are
ready, old Replica Set can be scaled down further, followed by scaling up the new Replica Set,
ensuring that the total number of Pods available at all times during the
update is at least 70% of the desired Pods.

##### Max Surge

`.spec.strategy.rollingUpdate.maxSurge` is an optional field that specifies the
maximum number of Pods that can be created above the desired number of Pods.
Value can be an absolute number (e.g. 5) or a percentage of desired Pods
(e.g. 10%).
This can not be 0 if `MaxUnavailable` is 0.
The absolute number is calculated from percentage by rounding up.
By default, a value of 1 is used.

For example, when this value is set to 30%, the new Replica Set can be scaled up immediately when
the rolling update starts, such that the total number of old and new Pods do not exceed
130% of desired Pods. Once old Pods have been killed,
the new Replica Set can be scaled up further, ensuring that the total number of Pods running
at any time during the update is at most 130% of desired Pods.

### Progress Deadline Seconds

`.spec.progressDeadlineSeconds` is an optional field that specifies the number of seconds you want
to wait for your Deployment to progress before the system reports back that the Deployment has
[failed progressing](#failed-deployment) - surfaced as a condition with `Type=Progressing`, `Status=False`.
and `Reason=ProgressDeadlineExceeded` in the status of the resource. The deployment controller will keep
retrying the Deployment. In the future, once automatic rollback will be implemented, the deployment
controller will roll back a Deployment as soon as it observes such a condition.

If specified, this field needs to be greater than `.spec.minReadySeconds`.

### Min Ready Seconds

`.spec.minReadySeconds` is an optional field (with default value of 600s) that specifies the
minimum number of seconds for which a newly created Pod should be ready
without any of its containers crashing, for it to be considered available.
This defaults to 0 (the Pod will be considered available as soon as it is ready).
To learn more about when a Pod is considered ready, see [Container Probes](/docs/user-guide/pod-states/#container-probes).

### Rollback To

`.spec.rollbackTo` is an optional field with the configuration the Deployment is rolling back to. Setting this field will trigger a rollback, and this field will be cleared every time a rollback is done.

#### Revision

`.spec.rollbackTo.revision` is an optional field specifying the revision to rollback to. This defaults to 0, meaning rollback to the last revision in history.

### Revision History Limit

A deployment's revision history is stored in the replica sets it controls.

`.spec.revisionHistoryLimit` is an optional field (with default value of two) that specifies the number of old Replica Sets to retain to allow rollback. Its ideal value depends on the frequency and stability of new deployments. All old Replica Sets will be kept by default, consuming resources in `etcd` and crowding the output of `kubectl get rs`, if this field is not set. The configuration of each Deployment revision is stored in its Replica Sets; therefore, once an old Replica Set is deleted, you lose the ability to rollback to that revision of Deployment.

More specifically, setting this field to zero means that all old replica sets with 0 replica will be cleaned up.
In this case, a new deployment rollout cannot be undone, since its revision history is cleaned up.

### Paused

`.spec.paused` is an optional boolean field for pausing and resuming a Deployment. It defaults to false (a Deployment is not paused).

## Alternative to Deployments

### kubectl rolling update

[Kubectl rolling update](/docs/user-guide/kubectl/v1.6/#rolling-update) updates Pods and Replication Controllers in a similar fashion.
But Deployments are recommended, since they are declarative, server side, and have additional features, such as rolling back to any previous revision even after the rolling update is done.
