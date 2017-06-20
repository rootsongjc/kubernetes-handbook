# Horizontal Pod Autoscaling

应用的资源使用率通常都有高峰和低谷的时候，如何削峰填谷，提高集群的整体资源利用率，让service中的Pod个数自动调整呢？这就有赖于Horizontal Pod Autoscaling了，顾名思义，使Pod水平自动缩放。这个Object（跟Pod、Deployment一样都是API resource）也是最能体现kubernetes之于传统运维价值的地方，不再需要手动扩容了，终于实现自动化了，还可以自定义指标，没准未来还可以通过人工智能自动进化呢！

Horizontal Pod Autoscaling仅适用于Deployment和ReplicationController（ReplicaSet已经被ReplicationController取代），在V1版本中仅支持根据Pod的CPU利用率扩所容，在v1alpha版本中，支持根据内存和用户自定义的metric扩缩容。

如果你不想看下面的文章可以直接看下面的示例图，组件交互、组件的配置、命令示例，都画在图上了。

Horizontal Pod Autoscaling由API server和controller共同实现。

![horizontal-pod-autoscaler](../images/horizontal-pod-autoscaler.png)

## Metrics支持

在不同版本得API中，HPA autoscale时可以根据以下指标来判断：

- autoscaling/v1
  - CPU
- autoscaling/v2alpha1
  - 内存
  - 自定义metrics
    - kubernetes1.6起支持自定义metrics，但是必须在kube-controller-manager中配置如下两项：
      - `--horizontal-pod-autoscaler-use-rest-clients=true`
      - `--api-server`指向[kube-aggregator](https://github.com/kubernetes/kube-aggregator)，也可以使用heapster来实现，通过在启动heapster的时候指定`--api-server=true`。查看[kubernetes metrics](https://github.com/kubernetes/metrics)
  - 多种metrics组合
    - HPA会根据每个metric的值计算出scale的值，并将最大的那个指作为扩容的最终结果。

## 使用kubectl管理

Horizontal Pod Autoscaling作为API resource也可以像Pod、Deployment一样使用kubeclt命令管理，使用方法跟它们一样，资源名称为`hpa`。

```
kubectl create hpa
kubebectl get hpa
kubectl describe hpa
kubectl delete hpa
```

有一点不同的是，可以直接使用`kubectl autoscale`直接通过命令行的方式创建Horizontal Pod Autoscaler。

用法如下：

```b
kubectl autoscale (-f FILENAME | TYPE NAME | TYPE/NAME) [--min=MINPODS] --max=MAXPODS
[--cpu-percent=CPU] [flags] [options]
```

举个例子：

```
kubectl autoscale deployment foo --min=2 --max=5 --cpu-percent=80
```

为Deployment foo创建 一个autoscaler，当Pod的CPU利用率达到80%的时候，RC的replica数在2到5之间。该命令的详细使用文档见https://kubernetes.io/docs/user-guide/kubectl/v1.6/#autoscale 。

**注意** ：如果为ReplicationController创建HPA的话，无法使用rolling update，但是对于Deployment来说是可以的，因为Deployment在执行rolling update的时候会自动创建新的ReplicationController。

## 参考

HPA设计文档：https://github.com/kubernetes/community/blob/master/contributors/design-proposals/horizontal-pod-autoscaler.md

HPA说明：https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/

HPA详解：https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/

kubectl autoscale命令详细使用说明：https://kubernetes.io/docs/user-guide/kubectl/v1.6/#autoscale

自定义metrics开发：https://github.com/kubernetes/metrics