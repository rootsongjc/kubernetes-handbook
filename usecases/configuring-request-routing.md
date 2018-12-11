# 配置请求的路由规则

**注意：本书中的 Service Mesh 章节已不再维护，请转到 [istio-handbook](https://jimmysong.io/istio-handbook) 中浏览。**

在上一节[安装istio](istio-installation.md)中我们创建[BookInfo](https://istio.io/docs/samples/bookinfo.html)的示例，熟悉了Istio的基本功能，现在我们再来看一下istio的高级特性——配置请求的路由规则。

使用istio我们可以根据**权重**和**HTTP headers**来动态配置请求路由。

## 基于内容的路由

因为BookInfo示例部署了3个版本的评论微服务，我们需要设置一个默认路由。 否则，当你多次访问应用程序时，会注意到有时输出包含星级，有时候又没有。 这是因为没有明确的默认版本集，Istio将以随机方式将请求路由到服务的所有可用版本。

**注意**：假定您尚未设置任何路由。如果您已经为示例创建了冲突的路由规则，则需要在以下命令中使用replace而不是create。

下面这个例子能够根据网站的不同登陆用户，将流量划分到服务的不同版本和实例。跟kubernetes中的应用一样，所有的路由规则都是通过声明式的yaml配置。关于`reviews:v1`和`reviews:v2`的唯一区别是，v1没有调用评分服务，productpage页面上不会显示评分星标。

1. 将微服务的默认版本设置成v1。

 ```bash
 istioctl create -f samples/apps/bookinfo/route-rule-all-v1.yaml
 ```

 使用以下命令查看定义的路由规则。

 ```bash
 istioctl get route-rules -o yaml
 ```

 ```yaml
 type: route-rule
 name: details-default
 namespace: default
 spec:
   destination: details.default.svc.cluster.local
   precedence: 1
   route:
   - tags:
       version: v1
 ---
 type: route-rule
 name: productpage-default
 namespace: default
 spec:
   destination: productpage.default.svc.cluster.local
   precedence: 1
   route:
   - tags:
       version: v1
 ---
 type: route-rule
 name: reviews-default
 namespace: default
 spec:
   destination: reviews.default.svc.cluster.local
   precedence: 1
   route:
   - tags:
       version: v1
 ---
 type: route-rule
 name: ratings-default
 namespace: default
 spec:
   destination: ratings.default.svc.cluster.local
   precedence: 1
   route:
   - tags:
       version: v1
 ---
 ```

 由于对代理的规则传播是异步的，因此在尝试访问应用程序之前，需要等待几秒钟才能将规则传播到所有pod。

2. 在浏览器中打开BookInfo URL（`http://$GATEWAY_URL/productpage` ，我们在上一节中使用的是 `http://ingress.istio.io/productpage`）您应该会看到BookInfo应用程序的产品页面显示。 注意，产品页面上没有评分星，因为`reviews:v1`不访问评级服务。

3. 将特定用户路由到`reviews:v2`。

   为测试用户jason启用评分服务，将productpage的流量路由到`reviews:v2`实例上。

   ```bash
   istioctl create -f samples/apps/bookinfo/route-rule-reviews-test-v2.yaml
   ```

   确认规则生效：

   ```bash
   istioctl get route-rule reviews-test-v2
   ```

   ```yaml
   destination: reviews.default.svc.cluster.local
   match:
     httpHeaders:
       cookie:
         regex: ^(.*?;)?(user=jason)(;.*)?$
   precedence: 2
   route:
   - tags:
       version: v2
   ```

4. 使用jason用户登陆productpage页面。

   你可以看到每个刷新页面时，页面上都有一个1到5颗星的评级。如果你使用其他用户登陆的话，将因继续使用`reviews:v1`而看不到星标评分。

## 内部实现

在这个例子中，一开始使用istio将100%的流量发送到BookInfo服务的`reviews:v1`的实例上。然后又根据请求的header（例如用户的cookie）将流量选择性的发送到`reviews:v2`实例上。

验证了v2实例的功能后，就可以将全部用户的流量发送到v2实例上，或者逐步的迁移流量，如10%、20%直到100%。

如果你看了[故障注入](https://istio.io/docs/tasks/fault-injection.html)这一节，你会发现v2版本中有个bug，而在v3版本中修复了，你想将流量迁移到`reviews:v1`迁移到`reviews:v3`版本上，只需要运行如下命令：

1. 将50%的流量从`reviews:v1`转移到`reviews:v3`上。

 ```bash
 istioctl replace -f samples/apps/bookinfo/route-rule-reviews-50-v3.yaml
 ```

 注意这次使用的是`replace`命令，而不是`create`，因为该rule已经在前面创建过了。

2. 登出jason用户，或者删除测试规则，可以看到新的规则已经生效。

   删除测试规则。

   ```bash
   istioctl delete route-rule reviews-test-v2
   istioctl delete route-rule ratings-test-delay
   ```

   现在的规则就是刷新`productpage`页面，50%的概率看到红色星标的评论，50%的概率看不到星标。

   注意：因为使用Envoy sidecar的实现，你需要刷新页面很多次才能看到接近规则配置的概率分布，你可以将v3的概率修改为90%，这样刷新页面时，看到红色星标的概率更高。

3. 当v3版本的微服务稳定以后，就可以将100%的流量分摊到`reviews:v3`上了。

   ```bash
   istioctl replace -f samples/apps/bookinfo/route-rule-reviews-v3.yaml
   ```

   现在不论你使用什么用户登陆`productpage`页面，你都可以看到带红色星标评分的评论了。

