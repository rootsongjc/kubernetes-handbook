---
weight: 108
linktitle: client-go informer
title: client-go 中的 informer 源码分析
summary: 本文将以图文并茂的方式对 client-go 中的 informer 的源码分析。
date: '2022-09-05T11:00:00+08:00'
type: book
---

{{<callout note "说明">}}
本文由 [jianlongzhou](https://github.com/jianlongzhou) 贡献。
{{</callout>}}

本文将以图文并茂的方式对 client-go 中的 informer 的源码分析，其整体流程图如下所示。

![client-go informer](https://assets.jimmysong.io/images/book/kubernetes-handbook/develop/client-go-informer-sourcecode-analyse/client-go-informer.webp)

## 前言

Kubernetes 作为新一代的基础设施系统，其重要性已经不言而喻了。基于控制器模型实现的声明式 API 支持着集群中各类型的工作负载稳定高效的按照期望状态运转，随着越来越多的用户选择 kubernetes，无论是为了深入了解 kubernetes 这一云原生操作系统的工作逻辑，还是期待能够根据自己的特定业务需求对 kubernetes 进行二次开发，了解控制器模型的实现机制都是非常重要的。kubernetes 提供了 client-go 以方便使用 go 语言进行二次快发，本文试图讲述 client-go 各模块如 informer、reflector、cache 等实现细节。

当我们需要利用 client-go 来实现自定义控制器时，通常会使用 informerFactory 来管理控制器需要的多个资源对象的 informer 实例

```go
// 创建一个 informer factory
kubeInformerFactory := kubeinformers.NewSharedInformerFactory(kubeClient, time.Second*30)
// factory 已经为所有 k8s 的内置资源对象提供了创建对应 informer 实例的方法，调用具体 informer 实例的 Lister 或 Informer 方法
// 就完成了将 informer 注册到 factory 的过程
deploymentLister := kubeInformerFactory.Apps().V1().Deployments().Lister()
// 启动注册到 factory 的所有 informer
kubeInformerFactory.Start(stopCh)
```

### SharedInformerFactory 结构

使用 sharedInformerFactory 可以统一管理控制器中需要的各资源对象的 informer 实例，避免同一个资源创建多个实例，这里的 informer 实现是 shareIndexInformer
NewSharedInformerFactory 调用了 NewSharedInformerFactoryWithOptions，将返回一个 sharedInformerFactory 对象。下面是对该结构的描述：

- client: clientset，支持直接请求 api 中各内置资源对象的 restful group 客户端集合
- namespace: factory 关注的 namespace（默认 All Namespace），informer 中的 reflector 将只会 listAndWatch 指定 namespace 的资源
- defaultResync: 用于初始化持有的 shareIndexInformer 的 resyncCheckPeriod 和 defaultEventHandlerResyncPeriod 字段，用于定时的将 local store 同步到 deltaFIFO
- customResync：支持针对每一个 informer 来配置 resync 时间，通过 WithCustomResyncConfig 这个 Option 配置，否则就用指定的 defaultResync
- informers：factory 管理的 informer 集合
- startedInformers：记录已经启动的 informer 集合

```go
type sharedInformerFactory struct {
   client           kubernetes.Interface //clientset
   namespace        string //关注的 namepace，可以通过 WithNamespace Option 配置
   tweakListOptions internalinterfaces.TweakListOptionsFunc
   lock             sync.Mutex
   defaultResync    time.Duration //前面传过来的时间，如 30s
   customResync     map[reflect.Type]time.Duration //自定义 resync 时间
   informers map[reflect.Type]cache.SharedIndexInformer //针对每种类型资源存储一个 informer，informer 的类型是 ShareIndexInformer
   startedInformers map[reflect.Type]bool //每个 informer 是否都启动了
}
```

sharedInformerFactory 对象的关键方法：

#### 创建一个 sharedInformerFactory

```go
func NewSharedInformerFactoryWithOptions(client kubernetes.Interface, defaultResync time.Duration, options ...SharedInformerOption) SharedInformerFactory {
   factory := &sharedInformerFactory{
      client:           client,          //clientset，对原生资源来说，这里可以直接使用 kube clientset
      namespace:        v1.NamespaceAll, //可以看到默认是监听所有 ns 下的指定资源
      defaultResync:    defaultResync,   //30s
      //以下初始化 map 结构
      informers:        make(map[reflect.Type]cache.SharedIndexInformer),
      startedInformers: make(map[reflect.Type]bool),
      customResync:     make(map[reflect.Type]time.Duration),
   }
   return factory
}
```

#### 启动 factory 下的所有 informer

```go
func (f *sharedInformerFactory) Start(stopCh <-chan struct{}) {
   f.lock.Lock()
   defer f.lock.Unlock()

   for informerType, informer := range f.informers {
      if !f.startedInformers[informerType] {
         //直接起 gorouting 调用 informer 的 Run 方法，并且标记对应的 informer 已经启动
         go informer.Run(stopCh)
         f.startedInformers[informerType] = true
      }
   }
}
```

#### 等待 informer 的 cache 被同步

等待每一个 ShareIndexInformer 的 cache 被同步，具体怎么算同步完成？

- sharedInformerFactory 的 WaitForCacheSync 将会不断调用 factory 持有的所有 informer 的 HasSynced 方法，直到返回 true

- 而 informer 的 HasSynced 方法调用的自己持有的 controller 的 HasSynced 方法（informer 结构持有 controller 对象，下文会分析 informer 的结构）

- informer 中的 controller 的 HasSynced 方法则调用的是 controller 持有的 deltaFIFO 对象的 HasSynced 方法

也就说 sharedInformerFactory 的 WaitForCacheSync 方法判断 informer 的 cache 是否同步，最终看的是 informer 中的 deltaFIFO 是否同步了，deltaFIFO 的结构下文将会分析

```go
func (f *sharedInformerFactory) WaitForCacheSync(stopCh <-chan struct{}) map[reflect.Type]bool {
   //获取每一个已经启动的 informer
   informers := func() map[reflect.Type]cache.SharedIndexInformer {
      f.lock.Lock()
      defer f.lock.Unlock()

      informers := map[reflect.Type]cache.SharedIndexInformer{}
      for informerType, informer := range f.informers {
         if f.startedInformers[informerType] {
            informers[informerType] = informer
         }
      }
      return informers
   }()

   res := map[reflect.Type]bool{}
   // 等待他们的 cache 被同步，调用的是 informer 的 HasSynced 方法
   for informType, informer := range informers {
      res[informType] = cache.WaitForCacheSync(stopCh, informer.HasSynced)
   }
   return res
}
```

#### factory 为自己添加 informer

只有向 factory 中添加 informer，factory 才有意义，添加完成之后，上面 factory 的 start 方法就可以启动了

> obj: informer 关注的资源如 deployment{}
> newFunc: 一个知道如何创建指定 informer 的方法，k8s 为每一个内置的对象都实现了这个方法，比如创建 deployment 的 ShareIndexInformer 的方法

```go
// 向 factory 中注册指定的 informer
func (f *sharedInformerFactory) InformerFor(obj runtime.Object, newFunc internalinterfaces.NewInformerFunc) cache.SharedIndexInformer {
   f.lock.Lock()
   defer f.lock.Unlock()
   //根据对象类型判断 factory 中是否已经有对应 informer
   informerType := reflect.TypeOf(obj)
   informer, exists := f.informers[informerType]
   if exists {
      return informer
   }
   //如果 factory 中已经有这个对象类型的 informer，就不创建了
   resyncPeriod, exists := f.customResync[informerType]
   if !exists {
      resyncPeriod = f.defaultResync
   }
   //没有就根据 newFunc 创建一个，并存在 map 中
   informer = newFunc(f.client, resyncPeriod)
   f.informers[informerType] = informer

   return informer
}
```

##### shareIndexInformer 对应的 newFunc 的实现

client-go 中已经为所有内置对象都提供了 NewInformerFunc

以 deployment 为例，通过调用 factory.Apps().V1().Deployments() 即可为 factory 添加一个 deployment 对应的 shareIndexInformer 的实现，具体过程如下：

- 调用 factory.Apps().V1().Deployments() 即会调用以下 Deployments 方法创建 deploymentInformer 对象

```go
func (v *version) Deployments() DeploymentInformer {
 return &deploymentInformer{factory: v.factory, namespace: v.namespace, tweakListOptions: v.tweakListOptions}
}
```

- 只要调用了 factory.Apps().V1().Deployments() 返回的 deploymentInformer 的 Informer 或 Lister 方法，就完成了向 factory 中添加 deployment informer

```go
// deploymentInformer 对象具有 defaultInformer、Informer、Lister 方法
// 可以看到创建 deploymentInformer 时传递了一个带索引的缓存，附带了一个 namespace 索引，后面可以了解带索引的缓存实现，比如可以支持查询：某个 namespace 下的所有 pod

// 用于创建对应的 shareIndexInformer，该方法提供给 factory 的 InformerFor 方法
func (f *deploymentInformer) defaultInformer(client kubernetes.Interface, resyncPeriod time.Duration) cache.SharedIndexInformer {
 return NewFilteredDeploymentInformer(client, f.namespace, resyncPeriod, cache.Indexers{cache.NamespaceIndex: cache.MetaNamespaceIndexFunc}, f.tweakListOptions)
}

// 向 factor 中添加 dpeloyment 的 shareIndexInformer 并返回
func (f *deploymentInformer) Informer() cache.SharedIndexInformer {
 return f.factory.InformerFor(&appsv1.Deployment{}, f.defaultInformer)
}

// 返回 dpeloyment 的 lister 对象，该 lister 中持有上面创建出的 shareIndexInformer 的 cache 的引用，方便通过缓存获取对象
func (f *deploymentInformer) Lister() v1.DeploymentLister {
 return v1.NewDeploymentLister(f.Informer().GetIndexer())
}
```

- deploymentInformer 的 defaultInformer 方法将会创建出一个 shareIndexInformer

```go
// 可先看看下面的 shareIndexInformer 结构
func NewFilteredDeploymentInformer(client kubernetes.Interface, namespace string, resyncPeriod time.Duration, indexers cache.Indexers, tweakListOptions internalinterfaces.TweakListOptionsFunc) cache.SharedIndexInformer {
   return cache.NewSharedIndexInformer(
      // 定义对象的 ListWatch 方法，这里直接用的是 clientset 中的方法
      &cache.ListWatch{
         ListFunc: func(options v1.ListOptions) (runtime.Object, error) {
            if tweakListOptions != nil {
               tweakListOptions(&options)
            }
            return client.AppsV1beta1().Deployments(namespace).List(options)
         },
         WatchFunc: func(options v1.ListOptions) (watch.Interface, error) {
            if tweakListOptions != nil {
               tweakListOptions(&options)
            }
            return client.AppsV1beta1().Deployments(namespace).Watch(options)
         },
      },
      &appsv1beta1.Deployment{},
      resyncPeriod, //创建 factory 是指定的时间，如 30s
      indexers,
   )
}
```

### shareIndexInformer 结构

> indexer：底层缓存，其实就是一个 map 记录对象，再通过一些其他 map 在插入删除对象是根据索引函数维护索引 key 如 ns 与对象 pod 的关系
> controller：informer 内部的一个 controller，这个 controller 包含 reflector：根据用户定义的 ListWatch 方法获取对象并更新增量队列 DeltaFIFO
> processor：知道如何处理 DeltaFIFO 队列中的对象，实现是 sharedProcessor{}
> listerWatcher：知道如何 list 对象和 watch 对象的方法
> objectType：deployment{}
> resyncCheckPeriod: 给自己的 controller 的 reflector 每隔多少 s<尝试>调用 listener 的 shouldResync 方法
> defaultEventHandlerResyncPeriod：通过 AddEventHandler 方法给 informer 配置回调时如果没有配置的默认值，这个值用在 processor 的 listener 中判断是否需要进行 resync，最小 1s

两个字段的默认值都是来自创建 factory 时指定的 defaultResync，当 resyncPeriod < s.resyncCheckPeriod 时，如果 informer 已经启动了才添加的 EventHandler，那么调整 resyncPeriod 为 resyncCheckPeriod，否则调整 resyncCheckPeriod 为 resyncPeriod

```go
type sharedIndexInformer struct {
   indexer    Indexer //informer 中的底层缓存 cache
   controller Controller //持有 reflector 和 deltaFIFO 对象，reflector 对象将会 listWatch 对象添加到 deltaFIFO，同时更新 indexer cahce，更新成功则通过 sharedProcessor 触发用户配置的 Eventhandler

   processor             *sharedProcessor //持有一系列的 listener，每个 listener 对应用户的 EventHandler
   cacheMutationDetector MutationDetector //可以先忽略，这个对象可以用来监测 local cache 是否被外部直接修改

   // This block is tracked to handle late initialization of the controller
   listerWatcher ListerWatcher //deployment 的 listWatch 方法
   objectType    runtime.Object

   // resyncCheckPeriod is how often we want the reflector's resync timer to fire so it can call
   // shouldResync to check if any of our listeners need a resync.
   resyncCheckPeriod time.Duration
   // defaultEventHandlerResyncPeriod is the default resync period for any handlers added via
   // AddEventHandler (i.e. they don't specify one and just want to use the shared informer's default
   // value).
   defaultEventHandlerResyncPeriod time.Duration
   // clock allows for testability
   clock clock.Clock

   started, stopped bool
   startedLock      sync.Mutex

   // blockDeltas gives a way to stop all event distribution so that a late event handler
   // can safely join the shared informer.
   blockDeltas sync.Mutex
}
```

sharedIndexInformer 对象的关键方法：

#### sharedIndexInformer 的 Run 方法

前面 factory 的 start 方法就是调用了这个 Run 方法

该方法初始化了 controller 对象并启动，同时调用 processor.run 启动所有的 listener，用于回调用户配置的 EventHandler

> 具体 sharedIndexInformer 中的 processor 中的 listener 是怎么添加的，看下文 shareProcessor 的分析

```go
func (s *sharedIndexInformer) Run(stopCh <-chan struct{}) {
   defer utilruntime.HandleCrash()
   //创建一个 DeltaFIFO，用于 shareIndexInformer.controller.reflector
   //可以看到这里把 indexer 即本地缓存传入，用来初始化 deltaFIFO 的 knownObject 字段
   fifo := NewDeltaFIFO(MetaNamespaceKeyFunc, s.indexer)
   //shareIndexInformer 中的 controller 的配置
   cfg := &Config{
      Queue:            fifo,
      ListerWatcher:    s.listerWatcher,
      ObjectType:       s.objectType,
      FullResyncPeriod: s.resyncCheckPeriod,
      RetryOnError:     false,
      ShouldResync:     s.processor.shouldResync, // 这个 shouldResync 方法将被用在 reflector ListAndWatch 方法中判断定时时间 resyncCheckPeriod 到了之后该不该进行 resync 动作
      //一个知道如何处理从 informer 中的 controller 中的 deltaFIFO pop 出来的对象的方法
      Process: s.HandleDeltas,
   }

   func() {
      s.startedLock.Lock()
      defer s.startedLock.Unlock()
      // 这里 New 一个具体的 controller
      s.controller = New(cfg)
      s.controller.(*controller).clock = s.clock
      s.started = true
   }()

   // Separate stop channel because Processor should be stopped strictly after controller
   processorStopCh := make(chan struct{})
   var wg wait.Group
   defer wg.Wait()              // Wait for Processor to stop
   defer close(processorStopCh) // Tell Processor to stop
   // 调用 processor.run 启动所有的 listener，回调用户配置的 EventHandler
   wg.StartWithChannel(processorStopCh, s.processor.run)

   // 启动 controller
   s.controller.Run(stopCh)
}
```

#### 为 shareIndexInformer 创建 controller

创建 Controller 的 New 方法会生成一个 controller 对象，只初始化 controller 的 config 成员，controller 的 reflector 成员是在 Run 的时候初始化：

- 通过执行 reflector.Run 方法启动 reflector，开启对指定对象的 listAndWatch 过程，获取的对象将添加到 reflector 的 deltaFIFO 中

- 通过不断执行 processLoop 方法，从 DeltaFIFO pop 出对象，再调用 reflector 的 Process（就是 shareIndexInformer 的 HandleDeltas 方法）处理

```go
func New(c *Config) Controller {
   ctlr := &controller{
      config: *c,
      clock:  &clock.RealClock{},
   }
   return ctlr
}
//更多字段的配置是在 Run 的时候
func (c *controller) Run(stopCh <-chan struct{}) {
   // 使用 config 创建一个 Reflector
   r := NewReflector(
      c.config.ListerWatcher, // deployment 的 listWatch 方法
      c.config.ObjectType, // deployment{}
      c.config.Queue, //DeltaFIFO
      c.config.FullResyncPeriod, //30s
   )
   r.ShouldResync = c.config.ShouldResync //来自 sharedProcessor 的方法
   r.clock = c.clock

   c.reflectorMutex.Lock()
   c.reflector = r
   c.reflectorMutex.Unlock()

   var wg wait.Group
   defer wg.Wait()
   // 启动 reflector，执行 ListWatch 方法
   wg.StartWithChannel(stopCh, r.Run)
   // 不断执行 processLoop，这个方法其实就是从 DeltaFIFO pop 出对象，再调用 reflector 的 Process（其实是 shareIndexInformer 的 HandleDeltas 方法）处理
   wait.Until(c.processLoop, time.Second, stopCh)
}
```

#### controller 的 processLoop 方法

不断执行 processLoop，这个方法其实就是从 DeltaFIFO pop 出对象，再调用 reflector 的 Process（其实是 shareIndexInformer 的 HandleDeltas 方法）处理

```go
func (c *controller) processLoop() {
   for {
      obj, err := c.config.Queue.Pop(PopProcessFunc(c.config.Process))
      if err != nil {
         if err == ErrFIFOClosed {
            return
         }
         if c.config.RetryOnError {
            // This is the safe way to re-enqueue.
            c.config.Queue.AddIfNotPresent(obj)
         }
      }
   }
}
```

#### deltaFIFO pop 出来的对象处理逻辑

先看看 controller 怎么处理 DeltaFIFO 中的对象，需要注意 DeltaFIFO 中的 Deltas 的结构，是一个 slice，保存同一个对象的所有增量事件

![image](https://assets.jimmysong.io/images/book/kubernetes-handbook/develop/client-go-informer-sourcecode-analyse/deltafifo.webp)

sharedIndexInformer 的 HandleDeltas 处理从 deltaFIFO pod 出来的增量时，先尝试更新到本地缓存 cache，更新成功的话会调用 processor.distribute 方法向 processor 中的 listener 添加 notification，listener 启动之后会不断获取 notification 回调用户的 EventHandler 方法

- Sync: reflector list 到对象时 Replace 到 deltaFIFO 时 daltaType 为 Sync 或者 resync 把 localstrore 中的对象加回到 deltaFIFO
- Added、Updated: reflector watch 到对象时根据 watch event type 是 Add 还是 Modify 对应 deltaType 为 Added 或者 Updated
- Deleted: reflector watch 到对象的 watch event type 是 Delete 或者 re-list Replace 到 deltaFIFO 时 local store 多出的对象以 Delete 的方式加入 deltaFIFO

```go
func (s *sharedIndexInformer) HandleDeltas(obj interface{}) error {
   s.blockDeltas.Lock()
   defer s.blockDeltas.Unlock()

   // from oldest to newest
   for _, d := range obj.(Deltas) {
      switch d.Type {
      case Sync, Added, Updated:
         isSync := d.Type == Sync
         // 对象先通过 shareIndexInformer 中的 indexer 更新到缓存
         if old, exists, err := s.indexer.Get(d.Object); err == nil && exists {
            if err := s.indexer.Update(d.Object); err != nil {
               return err
            }
            // 如果 informer 的本地缓存更新成功，那么就调用 shareProcess 分发对象给用户自定义 controller 处理
            // 可以看到，对 EventHandler 来说，本地缓存已经存在该对象就认为是 update
            s.processor.distribute(updateNotification{oldObj: old, newObj: d.Object}, isSync)
         } else {
            if err := s.indexer.Add(d.Object); err != nil {
               return err
            }
            s.processor.distribute(addNotification{newObj: d.Object}, isSync)
         }
      case Deleted:
         if err := s.indexer.Delete(d.Object); err != nil {
            return err
         }
         s.processor.distribute(deleteNotification{oldObj: d.Object}, false)
      }
   }
   return nil
}
```

前面描述了 shareIndexInformer 内部如何从 deltaFIFO 取出对象更新缓存并通过 processor 回调用户的 EventHandler，那 deltaFIFO 中的增量事件是怎么加进入的呢？先看看 shareIndexInformer 中 controller 中的 reflector 实现

#### reflector.run 发起 ListWatch

reflector.run 将会调用指定资源的 ListAndWatch 方法，注意这里什么时候可能发生 re-list 或者 re-watch：因为是通过 wait.Util 不断调用 ListAndWatch 方法，所以只要该方法 return 了，那么就会发生 re-list，watch 过程则被嵌套在 for 循环中

- 以 ResourceVersion=0 开始首次的 List 操作获取指定资源的全量对象，并通过 reflector 的 syncWith 方法将所有对象批量插入 deltaFIFO
- List 完成之后将会更新 ResourceVersion 用户 Watch 操作，通过 reflector 的 watchHandler 方法把 watch 到的增量对象加入到 deltaFIFO

```go
func (r *Reflector) ListAndWatch(stopCh <-chan struct{}) error {
   // 以版本号 ResourceVersion=0 开始首次 list
   options := metav1.ListOptions{ResourceVersion: "0"}

   if err := func() error {
      initTrace := trace.New("Reflector ListAndWatch", trace.Field{"name", r.name})
      var list runtime.Object
      go func() {
         // 获取 list 的结果
         list, err = pager.List(context.Background(), options)
         close(listCh)
      }()
      listMetaInterface, err := meta.ListAccessor(list)
      // 根据结果更新版本号，用于接下来的 watch
      resourceVersion = listMetaInterface.GetResourceVersion()
      items, err := meta.ExtractList(list)
      // 这里的 syncWith 是把首次 list 到的结果通过 DeltaFIFO 的 Replce 方法批量添加到队列
      // 队列提供了 Resync 方法用于判断 Replace 批量插入的对象是否都 pop 出去了，factory/informer 的 WaitForCacheSync 就是调用了 DeltaFIFO 的的 Resync 方法
      if err := r.syncWith(items, resourceVersion); err != nil {
         return fmt.Errorf("%s: Unable to sync list result: %v", r.name, err)
      }
      r.setLastSyncResourceVersion(resourceVersion)
   }(); err != nil {
      return err
   }

  
  // 以 list 对象中获取的 ResourceVersion 不断 watch
   for {
      start := r.clock.Now()
      w, err := r.listerWatcher.Watch(options)
      // watchhandler 处理 watch 到的数据，即把对象根据 watch.type 增加到 DeltaFIFO 中
      if err := r.watchHandler(start, w, &resourceVersion, resyncerrc, stopCh); err != nil {
         if err != errorStopRequested {
            switch {
            case apierrs.IsResourceExpired(err):
               klog.V(4).Infof("%s: watch of %v ended with: %v", r.name, r.expectedType, err)
            default:
               klog.Warningf("%s: watch of %v ended with: %v", r.name, r.expectedType, err)
            }
         }
         return nil
      }
   }
}
```

##### list 出的对象批量插入 deltaFIFO

> 可以看到是 syncWith 方法是通过调用 deltaFIFO 的 Replace 实现批量插入，具体实现见下文中 deltaFIFO 的实现描述

```go
func (r *Reflector) syncWith(items []runtime.Object, resourceVersion string) error {
 found := make([]interface{}, 0, len(items))
 for _, item := range items {
  found = append(found, item)
 }
 return r.store.Replace(found, resourceVersion)
}
```

##### watch 出的增量对象插入到 deltaFIFO

> watch 到的对象直接根据 watch 到的事件类型 eventType 更新 store（即 deltaFIFO），注意这个 event 是 api 直接返回的，watch event type 可能是 Added、Modifyed、Deleted

```go
// watchHandler watches w and keeps *resourceVersion up to date.
func (r *Reflector) watchHandler(start time.Time, w watch.Interface, resourceVersion *string, errc chan error, stopCh <-chan struct{}) error {
 for {
  select {
  case <-stopCh:
   return errorStopRequested
  case err := <-errc:
   return err
  case event, ok := <-w.ResultChan():
   switch event.Type {
   case watch.Added:
    err := r.store.Add(event.Object)
   case watch.Modified:
    err := r.store.Update(event.Object)
   case watch.Deleted:
    err := r.store.Delete(event.Object)
   case watch.Bookmark:
    // A `Bookmark` means watch has synced here, just update the resourceVersion
   default:
    utilruntime.HandleError(fmt.Errorf("%s: unable to understand watch event %#v", r.name, event))
   }
   *resourceVersion = newResourceVersion
   r.setLastSyncResourceVersion(newResourceVersion)
  }
 }
}
```

##### 定时触发 resync

在 ListAndWatch 中还起了一个 gorouting 定时的进行 resync 动作

```go
 resyncerrc := make(chan error, 1)
 cancelCh := make(chan struct{})
 defer close(cancelCh)
 go func() {
    //获取一个定时 channel，定时的时间是创建 informer factory 时传入的 resyncPeriod
  resyncCh, cleanup := r.resyncChan()
  defer func() {
   cleanup() // Call the last one written into cleanup
  }()
  for {
   select {
   case <-resyncCh:
   case <-stopCh:
    return
   case <-cancelCh:
    return
   }
   if r.ShouldResync == nil || r.ShouldResync() {
    klog.V(4).Infof("%s: forcing resync", r.name)
    if err := r.store.Resync(); err != nil {
     resyncerrc <- err
     return
    }
   }
   cleanup()
   resyncCh, cleanup = r.resyncChan()
  }
 }()
```

调用 deltaFIFO 的 Resync 方法，把底层缓存的对象全部重新添加到 deltaFIFO 中

```go
func (f *DeltaFIFO) Resync() error {
   f.lock.Lock()
   defer f.lock.Unlock()

   if f.knownObjects == nil {
      return nil
   }

   keys := f.knownObjects.ListKeys()
   for _, k := range keys {
      if err := f.syncKeyLocked(k); err != nil {
         return err
      }
   }
   return nil
}
```

需要注意的是，在添加对象到 deltaFIFO 时会检查该队列中有没有增量没有处理完的，如果有则忽略这个对象的此次 resync

```go
func (f *DeltaFIFO) syncKeyLocked(key string) error {
   obj, exists, err := f.knownObjects.GetByKey(key)
   if err != nil {
      klog.Errorf("Unexpected error %v during lookup of key %v, unable to queue object for sync", err, key)
      return nil
   } else if !exists {
      klog.Infof("Key %v does not exist in known objects store, unable to queue object for sync", key)
      return nil
   }

   // If we are doing Resync() and there is already an event queued for that object,
   // we ignore the Resync for it. This is to avoid the race, in which the resync
   // comes with the previous value of object (since queueing an event for the object
   // doesn't trigger changing the underlying store <knownObjects>.
   id, err := f.KeyOf(obj)
   if err != nil {
      return KeyError{obj, err}
   }
   // 如果 deltaFIFO 中该对象还有增量没有处理，则忽略以避免冲突，原因如上面注释：在同一个对象的增量列表中，排在后面的增量的 object 相比前面的增量应该更新才是合理的
   if len(f.items[id]) > 0 {
      return nil
   }
  // 跟 deltaFIFO 的 Replace 方法一样，都是添加一个 Sync 类型的增量
   if err := f.queueActionLocked(Sync, obj); err != nil {
      return fmt.Errorf("couldn't queue object: %v", err)
   }
   return nil
}
```

### 底层缓存的实现

shareIndexInformer 中带有一个缓存 indexer，是一个支持索引的 map，优点是支持快速查询：

- Indexer、Queue 接口和 cache 结构体都实现了顶层的 Store 接口
- cache 结构体持有 threadSafeStore 对象，threadSafeStore 是线程安全的，并且具备自定义索引查找的能力

threadSafeMap 的结构如下：

> items:存储具体的对象，比如 key 为 ns/podName，value 为 pod{}
> Indexers:一个 map[string]IndexFunc 结构，其中 key 为索引的名称，如’namespace’字符串，value 则是一个具体的索引函数
> Indices:一个 map[string]Index 结构，其中 key 也是索引的名称，value 是一个 map[string]sets.String 结构，其中 key 是具体的 namespace，如 default 这个 ns，vlaue 则是这个 ns 下的按照索引函数求出来的值的集合，比如 default 这个 ns 下的所有 pod 对象名称

```go
type threadSafeMap struct {
   lock  sync.RWMutex
   items map[string]interface{}

   // indexers maps a name to an IndexFunc
   indexers Indexers
   // indices maps a name to an Index
   indices Indices
}

// Indexers maps a name to a IndexFunc
type Indexers map[string]IndexFunc

// Indices maps a name to an Index
type Indices map[string]Index
type Index map[string]sets.String
```

#### 索引的维护

通过在向 items 插入对象的过程中，遍历所有的 Indexers 中的索引函数，根据索引函数存储索引 key 到 value 的集合关系，以下图式结构可以很好的说明：

![图片来源于网络](https://user-images.githubusercontent.com/41672087/116666278-5981ca00-a9cd-11eb-9570-8ee6eb447d05.png)

#### 缓存中增加对象

在向 threadSafeMap 的 items map 中增加完对象后，再通过 updateIndices 更新索引结构

```go
func (c *threadSafeMap) Add(key string, obj interface{}) {
   c.lock.Lock()
   defer c.lock.Unlock()
   oldObject := c.items[key]
   //存储对象
   c.items[key] = obj
   //更新索引
   c.updateIndices(oldObject, obj, key)
}

// updateIndices modifies the objects location in the managed indexes, if this is an update, you must provide an oldObj
// updateIndices must be called from a function that already has a lock on the cache
func (c *threadSafeMap) updateIndices(oldObj interface{}, newObj interface{}, key string) {
   // if we got an old object, we need to remove it before we add it again
   if oldObj != nil {
      // 这是一个更新操作，先删除原对象的索引记录
      c.deleteFromIndices(oldObj, key)
   }
   // 枚举所有添加的索引函数
   for name, indexFunc := range c.indexers {
      //根据索引函数计算 obj 对应的
      indexValues, err := indexFunc(newObj)
      if err != nil {
         panic(fmt.Errorf("unable to calculate an index entry for key %q on index %q: %v", key, name, err))
      }
      index := c.indices[name]
      if index == nil {
         index = Index{}
         c.indices[name] = index
      }
      //索引函数计算出多个 value，也可能是一个，比如 pod 的 ns 就只有一个值，pod 的 label 可能就有多个值
      for _, indexValue := range indexValues {
         //比如 namespace 索引，根据 indexValue=default，获取 default 对应的 ji he 再把当前对象插入
         set := index[indexValue]
         if set == nil {
            set = sets.String{}
            index[indexValue] = set
         }
         set.Insert(key)
      }
   }
}
```

#### IndexFunc 索引函数

一个典型的索引函数 MetaNamespaceIndexFunc，方便查询时可以根据 namespace 获取该 namespace 下的所有对象

```go
// MetaNamespaceIndexFunc is a default index function that indexes based on an object's namespace
func MetaNamespaceIndexFunc(obj interface{}) ([]string, error) {
   meta, err := meta.Accessor(obj)
   if err != nil {
      return []string{""}, fmt.Errorf("object has no meta: %v", err)
   }
   return []string{meta.GetNamespace()}, nil
}
```

#### Index 方法利用索引查找对象

提供利用索引来查询的能力，Index 方法可以根据索引名称和对象，查询所有的关联对象

> 例如通过 `Index(“namespace”, &metav1.ObjectMeta{Namespace: namespace})`获取指定 ns 下的所有对象，具体可以参考 tools/cache/listers.go#ListAllByNamespace
>

```go
func (c *threadSafeMap) Index(indexName string, obj interface{}) ([]interface{}, error) {
   c.lock.RLock()
   defer c.lock.RUnlock()

   indexFunc := c.indexers[indexName]
   if indexFunc == nil {
      return nil, fmt.Errorf("Index with name %s does not exist", indexName)
   }

   indexKeys, err := indexFunc(obj)
   if err != nil {
      return nil, err
   }
   index := c.indices[indexName]

   var returnKeySet sets.String
   //例如 namespace 索引
   if len(indexKeys) == 1 {
      // In majority of cases, there is exactly one value matching.
      // Optimize the most common path - deduping is not needed here.
      returnKeySet = index[indexKeys[0]]
   //例如 label 索引
   } else {
      // Need to de-dupe the return list.
      // Since multiple keys are allowed, this can happen.
      returnKeySet = sets.String{}
      for _, indexKey := range indexKeys {
         for key := range index[indexKey] {
            returnKeySet.Insert(key)
         }
      }
   }

   list := make([]interface{}, 0, returnKeySet.Len())
   for absoluteKey := range returnKeySet {
      list = append(list, c.items[absoluteKey])
   }
   return list, nil
}
```

### deltaFIFO 实现

shareIndexInformer.controller.reflector 中的 deltaFIFO 实现

> items：记录 deltaFIFO 中的对象，注意 map 的 value 是一个 delta slice
> queue：记录上面 items 中的 key，维护对象的 fifo 顺序
> populated：队列中是否填充过数据，LIST 时调用 Replace 或调用 Delete/Add/Update 都会置为 true
> initialPopulationCount：首次 List 的时候获取到的数据就会调用 Replace 批量增加到队列，同时设置 initialPopulationCount 为 List 到的对象数量，每次 Pop 出来会减一，用于判断是否把首次批量插入的数据都 POP 出去了
> keyFunc：知道怎么从对象中解析出对应 key 的函数，如 MetaNamespaceKeyFunc 可以解析出 namespace/name 的形式
> knownObjects：这个其实就是 shareIndexInformer 中的 indexer 底层缓存的引用，可以认为和 etcd 中的数据一致

```go
// NewDeltaFIFO 方法在前面分析的 sharedIndexInformer 的 Run 方法中调用
// fifo := NewDeltaFIFO(MetaNamespaceKeyFunc, s.indexer)
func NewDeltaFIFO(keyFunc KeyFunc, knownObjects KeyListerGetter) *DeltaFIFO {
 f := &DeltaFIFO{
  items:        map[string]Deltas{},
  queue:        []string{},
  keyFunc:      keyFunc,
  knownObjects: knownObjects,
 }
 f.cond.L = &f.lock
 return f
}

type DeltaFIFO struct {
   // lock/cond protects access to 'items' and 'queue'.
   lock sync.RWMutex
   cond sync.Cond

   // We depend on the property that items in the set are in
   // the queue and vice versa, and that all Deltas in this
   // map have at least one Delta.
   // 这里的 Deltas 是 []Delta 类型
   items map[string]Deltas
   queue []string

   // populated is true if the first batch of items inserted by Replace() has been populated
   // or Delete/Add/Update was called first.
   populated bool
   // initialPopulationCount is the number of items inserted by the first call of Replace()
   initialPopulationCount int

   // keyFunc is used to make the key used for queued item
   // insertion and retrieval, and should be deterministic.
   keyFunc KeyFunc

   // knownObjects list keys that are "known", for the
   // purpose of figuring out which items have been deleted
   // when Replace() or Delete() is called.
   // 这个其实就是 shareIndexInformer 中的 indexer 底层缓存的引用
   knownObjects KeyListerGetter

   // Indication the queue is closed.
   // Used to indicate a queue is closed so a control loop can exit when a queue is empty.
   // Currently, not used to gate any of CRED operations.
   closed     bool
   closedLock sync.Mutex
}

type Delta struct {
   Type   DeltaType
   Object interface{}
}

// Deltas is a list of one or more 'Delta's to an individual object.
// The oldest delta is at index 0, the newest delta is the last one.
type Deltas []Delta
```

DeltaFIFO 关键的方法：

#### 向 deltaFIFO 批量插入对象

批量向队列插入数据的方法，注意 knownObjects 是 informer 中本地缓存 indexer 的引用

这里会更新 deltaFIFO 的 initialPopulationCount 为 Replace list 的对象总数加上 list 中相比 knownObjects 多出的对象数量。

> 因为 Replace 方法可能是 reflector 发生 re-list 的时候再次调用，这个时候就会出现 knownObjects 中存在的对象不在 Replace list 的情况（比如 watch 的 delete 事件丢失了），这个时候是把这些对象筛选出来，封装成 DeletedFinalStateUnknown 对象以 Delete type 类型再次加入到 deltaFIFO 中，这样最终从 detaFIFO 处理这个 DeletedFinalStateUnknown 增量时就可以更新本地缓存并且触发 reconcile。
> 因为这个对象最终的结构确实找不到了，所以只能用 knownObjects 里面的记录来封装 delta，所以叫做 FinalStateUnknown。

```go
func (f *DeltaFIFO) Replace(list []interface{}, resourceVersion string) error {
   f.lock.Lock()
   defer f.lock.Unlock()
   keys := make(sets.String, len(list))

   for _, item := range list {
      key, err := f.KeyOf(item)
      if err != nil {
         return KeyError{item, err}
      }
      keys.Insert(key)
      // 调用 deltaFIFO 的 queueActionLocked 向 deltaFIFO 增加一个增量
      // 可以看到 Replace 添加的 Delta type 都是 Sync
      if err := f.queueActionLocked(Sync, item); err != nil {
         return fmt.Errorf("couldn't enqueue object: %v", err)
      }
   }

   // 底层的缓存不应该会是 nil，可以忽略这种情况
   if f.knownObjects == nil {
      // Do deletion detection against our own list.
      queuedDeletions := 0
      for k, oldItem := range f.items {
         if keys.Has(k) {
            continue
         }
         // 当 knownObjects 为空时，如果 item 中存在对象不在新来的 list 中，那么该对象被认为要被删除
         var deletedObj interface{}
         if n := oldItem.Newest(); n != nil {
            deletedObj = n.Object
         }
         queuedDeletions++
         if err := f.queueActionLocked(Deleted, DeletedFinalStateUnknown{k, deletedObj}); err != nil {
            return err
         }
      }

      if !f.populated {
         f.populated = true
         // While there shouldn't be any queued deletions in the initial
         // population of the queue, it's better to be on the safe side.
         f.initialPopulationCount = len(list) + queuedDeletions
      }

      return nil
   }

   // Detect deletions not already in the queue.
   // 当 reflector 发生 re-list 时，可能会出现 knownObjects 中存在的对象不在 Replace list 的情况
   knownKeys := f.knownObjects.ListKeys()
   // 记录这次替换相当于在缓存中删除多少对象
   queuedDeletions := 0
   // 枚举 local store 中的所有对象
   for _, k := range knownKeys {
     // 对象也在 Replace list 中，所以跳过
      if keys.Has(k) {
         continue
      }
     // 对象在缓存，但不在 list 中，说明替换操作完成后，这个对象相当于被删除了
     // 注意这里的所谓替换，对 deltaFIFO 来说，是给队列中的对应对象增加一个
     // delete 增量 queueActionLocked(Deleted, DeletedFinalStateUnknown{k, deletedObj})
     // 真正删除缓存需要等到 DeletedFinalStateUnknown 增量被 POP 出来操作 local store 时
      deletedObj, exists, err := f.knownObjects.GetByKey(k)
      queuedDeletions++
      if err := f.queueActionLocked(Deleted, DeletedFinalStateUnknown{k, deletedObj}); err != nil {
         return err
      }
   }
     // 设置 f.initialPopulationCount，该值大于 0 表示首次插入的对象还没有全部 pop 出去
     // informer WaitForCacheSync 就是在等待该值为 0
   if !f.populated {
      f.populated = true
      f.initialPopulationCount = len(list) + queuedDeletions
   }

   return nil
}
```

#### 从 deltaFIFO pop 出对象

从队列中 Pop 出一个方法，并由函数 process 来处理，其实就是 shareIndexInformer 的 HandleDeltas

> 每次从 DeltaFIFO Pop 出一个对象，f.initialPopulationCount 会减一，初始值为 List 时的对象数量
> 前面的 Informer 的 WaitForCacheSync 最终就是调用了这个 HasSynced 方法

```go
func (f *DeltaFIFO) Pop(process PopProcessFunc) (interface{}, error) {
   f.lock.Lock()
   defer f.lock.Unlock()
   for {
      for len(f.queue) == 0 {
         // When the queue is empty, invocation of Pop() is blocked until new item is enqueued.
         // When Close() is called, the f.closed is set and the condition is broadcasted.
         // Which causes this loop to continue and return from the Pop().
         if f.IsClosed() {
            return nil, ErrFIFOClosed
         }

         f.cond.Wait()
      }
      //取出队首元素
      id := f.queue[0]
      //去掉队首元素
      f.queue = f.queue[1:]
      //首次填充的对象数减一
      if f.initialPopulationCount > 0 {
         f.initialPopulationCount--
      }
      item, ok := f.items[id]
      if !ok {
         // Item may have been deleted subsequently.
         continue
      }
      delete(f.items, id)
      //处理增量对象
      err := process(item)
      // 如果没有处理成功，那么就会重新加到 deltaFIFO 队列中
      if e, ok := err.(ErrRequeue); ok {
         f.addIfNotPresent(id, item)
         err = e.Err
      }
      // Don't need to copyDeltas here, because we're transferring
      // ownership to the caller.
      return item, err
   }
}
```

#### deltaFIFO 是否同步完成

串连前面的问题：factory 的 WaitForCacheSync 是如何等待缓存同步完成

> factory 的 WaitForCacheSync 方法调用 informer 的 HasSync 方法，继而调用 deltaFIFO 的 HasSync 方法，也就是判断从 reflector list 到的数据是否 pop 完

```go
func (f *DeltaFIFO) HasSynced() bool {
   f.lock.Lock()
   defer f.lock.Unlock()
   return f.populated && f.initialPopulationCount == 0
}
```

#### 同步 local store 到 deltaFIFO

> 所谓的 resync，其实就是把 knownObjects 即缓存中的对象全部再通过 queueActionLocked(Sync, obj) 加到队列

```go
func (f *DeltaFIFO) Resync() error {
   f.lock.Lock()
   defer f.lock.Unlock()

   if f.knownObjects == nil {
      return nil
   }

   keys := f.knownObjects.ListKeys()
   // 把 local store 中的对象都以 Sync 类型增量的形式重新放回到 deltaFIFO
   for _, k := range keys {
      if err := f.syncKeyLocked(k); err != nil {
         return err
      }
   }
   return nil
}

func (f *DeltaFIFO) syncKeyLocked(key string) error {
   obj, exists, err := f.knownObjects.GetByKey(key)

   // If we are doing Resync() and there is already an event queued for that object,
   // we ignore the Resync for it. This is to avoid the race, in which the resync
   // comes with the previous value of object (since queueing an event for the object
   // doesn't trigger changing the underlying store <knownObjects>.
   id, err := f.KeyOf(obj)
   if err != nil {
      return KeyError{obj, err}
   }
   // 如上述注释，在 resync 时，如果 deltaFIFO 中该对象还存在其他 delta 没处理，那么忽略这次的 resync
   // 因为调用 queueActionLocked 是增加 delta 是通过 append 的，且处理对象的增量 delta 时，是从 oldest 到 newdest 的
   // 所以如果某个对象还存在增量没处理，再 append 就可能导致后处理的 delta 是旧的对象
   if len(f.items[id]) > 0 {
      return nil
   }
   // 可以看到这里跟 list 一样，增加到 deltaFIFO 的是一个 Sync 类型的增量
   if err := f.queueActionLocked(Sync, obj); err != nil {
      return fmt.Errorf("couldn't queue object: %v", err)
   }
   return nil
}
```

#### 在 deltaFIFO 增加一个对象

注意这里在 append 增量时的去重逻辑：如果连续的两个增量类型都是 Deleted，那么就去掉一个（正常情况确实不会出现这样，且没必要），优先去掉前面所说的因为 re-list 可能导致的 api 与 local store 不一致而增加的 DeletedFinalStateUnknown 类型的增量

```go
//在队列中给指定的对象 append 一个 Delta
func (f *DeltaFIFO) queueActionLocked(actionType DeltaType, obj interface{}) error {
   id, err := f.KeyOf(obj)
   if err != nil {
      return KeyError{obj, err}
   }
   // 把增量 append 到 slice 的后面
   newDeltas := append(f.items[id], Delta{actionType, obj})
   // 连续的两个 Deleted delta 将会去掉一个
   newDeltas = dedupDeltas(newDeltas)
   if len(newDeltas) > 0 {
      // 维护 queue 队列
      if _, exists := f.items[id]; !exists {
         f.queue = append(f.queue, id)
      }
      f.items[id] = newDeltas
      f.cond.Broadcast()
   } else {
      // We need to remove this from our map (extra items in the queue are
      // ignored if they are not in the map).
      delete(f.items, id)
   }
   return nil
}
```

当前认为只有连续的两个 Delete delta 才有必要去重

```go
func dedupDeltas(deltas Deltas) Deltas {
 n := len(deltas)
 if n < 2 {
  return deltas
 }
  // 每次取最后两个 delta 来判断
 a := &deltas[n-1]
 b := &deltas[n-2]
 if out := isDup(a, b); out != nil {
  d := append(Deltas{}, deltas[:n-2]...)
  return append(d, *out)
 }
 return deltas
}

func isDup(a, b *Delta) *Delta {
  // 当前认为只有连续的两个 Delete delta 才有必要去重
 if out := isDeletionDup(a, b); out != nil {
  return out
 }
 // TODO: Detect other duplicate situations? Are there any?
 return nil
}

// keep the one with the most information if both are deletions.
func isDeletionDup(a, b *Delta) *Delta {
 if b.Type != Deleted || a.Type != Deleted {
  return nil
 }
 // Do more sophisticated checks, or is this sufficient?
  // 优先去重 DeletedFinalStateUnknown 类型的 Deleted delta
 if _, ok := b.Object.(DeletedFinalStateUnknown); ok {
  return a
 }
 return b
}
```

### sharedProcessor 的实现

shareIndexInformer 中的 sharedProcess 结构，用于分发 deltaFIFO 的对象，回调用户配置的 EventHandler 方法

可以看到 shareIndexInformer 中的 process 直接通过&sharedProcessor{clock: realClock}初始化

```go
// NewSharedIndexInformer creates a new instance for the listwatcher.
func NewSharedIndexInformer(lw ListerWatcher, objType runtime.Object, defaultEventHandlerResyncPeriod time.Duration, indexers Indexers) SharedIndexInformer {
   realClock := &clock.RealClock{}
   sharedIndexInformer := &sharedIndexInformer{
     // 初始化一个默认的 processor
      processor:                       &sharedProcessor{clock: realClock},
      indexer:                         NewIndexer(DeletionHandlingMetaNamespaceKeyFunc, indexers),
      listerWatcher:                   lw,
      objectType:                      objType,
      resyncCheckPeriod:               defaultEventHandlerResyncPeriod,
      defaultEventHandlerResyncPeriod: defaultEventHandlerResyncPeriod,
     // cacheMutationDetector：可以记录 local store 是否被外部修改
      cacheMutationDetector:           NewCacheMutationDetector(fmt.Sprintf("%T", objType)),
      clock:                           realClock,
   }
   return sharedIndexInformer
}
```

如下为 sharedProcessor 结构：

> listenersStarted：listeners 中包含的 listener 是否都已经启动了
> listeners：已添加的 listener 列表，用来处理 watch 到的数据
> syncingListeners：已添加的 listener 列表，用来处理 list 或者 resync 的数据

```go
type sharedProcessor struct {
   listenersStarted bool
   listenersLock    sync.RWMutex
   listeners        []*processorListener
   syncingListeners []*processorListener
   clock            clock.Clock
   wg               wait.Group
}
```

#### 理解 listeners 和 syncingListeners 的区别

processor 可以支持 listener 的维度配置是否需要 resync：一个 informer 可以配置多个 EventHandler，而一个 EventHandler 对应 processor 中的一个 listener，每个 listener 可以配置需不需要 resync，如果某个 listener 需要 resync，那么添加到 deltaFIFO 的 Sync 增量最终也只会回到对应的 listener

reflector 中会定时判断每一个 listener 是否需要进行 resync，判断的依据是看配置 EventHandler 的时候指定的 resyncPeriod，0 代表该 listener 不需要 resync，否则就每隔 resyncPeriod 看看是否到时间了

- listeners：记录了 informer 添加的所有 listener

- syncingListeners：记录了 informer 中哪些 listener 处于 sync 状态

syncingListeners 是 listeners 的子集，syncingListeners 记录那些开启了 resync 且时间已经到达了的 listener，把它们放在一个独立的 slice 是避免下面分析的 distribute 方法中把 obj 增加到了还不需要 resync 的 listener 中

#### 为 sharedProcessor 添加 listener

在 sharedProcessor 中添加一个 listener

```go
func (p *sharedProcessor) addListenerLocked(listener *processorListener) {
   // 同时添加到 listeners 和 syncingListeners 列表，但其实添加的是同一个对象的引用
   // 所以下面 run 启动的时候只需要启动 listeners 中 listener 就可以了
   p.listeners = append(p.listeners, listener)
   p.syncingListeners = append(p.syncingListeners, listener)
}
```

#### 启动 sharedProcessor 中的 listener

sharedProcessor 启动所有的 listener
是通过调用 listener.run 和 listener.pop 来启动一个 listener，两个方法具体作用看下文 processorListener 说明

```go
func (p *sharedProcessor) run(stopCh <-chan struct{}) {
   func() {
      p.listenersLock.RLock()
      defer p.listenersLock.RUnlock()
      for _, listener := range p.listeners {
        // listener 的 run 方法不断的从 listener 自身的缓冲区取出对象回调 handler
         p.wg.Start(listener.run)
        // listener 的 pod 方法不断的接收对象并暂存在自身的缓冲区中
         p.wg.Start(listener.pop)
      }
      p.listenersStarted = true
   }()
   <-stopCh
   p.listenersLock.RLock()
   defer p.listenersLock.RUnlock()
   for _, listener := range p.listeners {
      close(listener.addCh) // Tell .pop() to stop. .pop() will tell .run() to stop
   }
   p.wg.Wait() // Wait for all .pop() and .run() to stop
}
```

#### sharedProcessor 分发对象

distribute 方法是在前面介绍`[deltaFIFO pop出来的对象处理逻辑]`时提到的，把 notification 事件添加到 listener 中，listener 如何 pop 出 notification 回调 EventHandler 见下文 listener 部分分析

当通过 distribute 分发从 deltaFIFO 获取的对象时，如果 delta type 是 Sync，那么就会把对象交给 sync listener 来处理，而 Sync 类型的 delta 只能来源于下面两种情况：

- reflector list Replace 到 deltaFIFO 的对象：因为首次在 sharedProcessor 增加一个 listener 的时候是同时加在 listeners 和 syncingListeners 中的
- reflector 定时触发 resync local store 到 deltaFIFO 的对象：因为每次 reflector 调用 processor 的 shouldResync 时，都会把达到 resync 条件的 listener 筛选出来重新放到 p.syncingListeners

上面两种情况都可以在 p.syncingListeners 中准备好 listener

```go
func (p *sharedProcessor) distribute(obj interface{}, sync bool) {
   p.listenersLock.RLock()
   defer p.listenersLock.RUnlock()
   // 如果是通过 reflector list Replace 到 deltaFIFO 的对象或者 reflector 定时触发 resync 到 deltaFIFO 的对象，那么 distribute 到 syncingListeners
   if sync {
     // 保证 deltaFIFO Resync 方法过来的 delta obj 只给开启了 resync 能力的 listener
      for _, listener := range p.syncingListeners {
         listener.add(obj)
      }
   } else {
      for _, listener := range p.listeners {
         listener.add(obj)
      }
   }
}
```

### processorListener 结构

sharedProcessor 中的 listener 具体的类型：运转逻辑就是把用户通过 addCh 增加的事件发送到 nextCh 供 run 方法取出回调 Eventhandler，因为 addCh 和 nectCh 都是无缓冲 channel，所以中间引入 ringBuffer 做缓存

processorListener 是 sharedIndexInformer 调用 AddEventHandler 时创建并添加到 sharedProcessor，对于一个 Informer，可以多次调用 AddEventHandler 来添加多个 listener

> addCh：无缓冲的 chan，listener 的 pod 方法不断从 addCh 取出对象丢给 nextCh。addCh 中的对象来源于 listener 的 add 方法，如果 nextCh 不能及时消费，则放入缓冲区 pendingNotifications
> nextCh：无缓冲的 chan，listener 的 run 方法不断从 nextCh 取出对象回调用户 handler。nextCh 的对象来源于 addCh 或者缓冲区
> pendingNotifications：一个无容量限制的环形缓冲区，可以理解为可以无限存储的队列，用来存储 deltaFIFO 分发过来的消息
> nextResync：由 resyncPeriod 和 requestedResyncPeriod 计算得出，与当前时间 now 比较判断 listener 是否该进行 resync 了
> resyncPeriod：listener 自身期待多长时间进行 resync
> requestedResyncPeriod：informer 希望 listener 多长时间进行 resync

```go
type processorListener struct {
   nextCh chan interface{}
   addCh  chan interface{}

   handler ResourceEventHandler

   // pendingNotifications is an unbounded ring buffer that holds all notifications not yet distributed.
   // There is one per listener, but a failing/stalled listener will have infinite pendingNotifications
   // added until we OOM.
   // TODO: This is no worse than before, since reflectors were backed by unbounded DeltaFIFOs, but
   // we should try to do something better.
   pendingNotifications buffer.RingGrowing

   // requestedResyncPeriod is how frequently the listener wants a full resync from the shared informer
   requestedResyncPeriod time.Duration
   // resyncPeriod is how frequently the listener wants a full resync from the shared informer. This
   // value may differ from requestedResyncPeriod if the shared informer adjusts it to align with the
   // informer's overall resync check period.
   resyncPeriod time.Duration
   // nextResync is the earliest time the listener should get a full resync
   nextResync time.Time
   // resyncLock guards access to resyncPeriod and nextResync
   resyncLock sync.Mutex
}
```

#### 在 listener 中添加事件

shareProcessor 中的 distribute 方法调用的是 listener 的 add 来向 addCh 增加消息，注意 addCh 是无缓冲的 chan，依赖 pop 不断从 addCh 取出数据

```go
func (p *processorListener) add(notification interface{}) {
  // 虽然 p.addCh 是一个无缓冲的 channel，但是因为 listener 中存在 ring buffer，所以这里并不会一直阻塞
   p.addCh <- notification
}
```

#### 判断是否需要 resync

如果 resyncPeriod 为 0 表示不需要 resync，否则判断当前时间 now 是否已经超过了 nextResync，是的话则返回 true 表示需要 resync。其中 nextResync 在每次调用 listener 的 shouldResync 方法成功时更新

```go
// shouldResync queries every listener to determine if any of them need a resync, based on each
// listener's resyncPeriod.
func (p *sharedProcessor) shouldResync() bool {
   p.listenersLock.Lock()
   defer p.listenersLock.Unlock()
   // 这里每次都会先置空列表，保证里面记录了当前需要 resync 的 listener
   p.syncingListeners = []*processorListener{}

   resyncNeeded := false
   now := p.clock.Now()
   for _, listener := range p.listeners {
      // need to loop through all the listeners to see if they need to resync so we can prepare any
      // listeners that are going to be resyncing.
      if listener.shouldResync(now) {
         resyncNeeded = true
         // 达到 resync 条件的 listener 被加入 syncingListeners
         p.syncingListeners = append(p.syncingListeners, listener)
         listener.determineNextResync(now)
      }
   }
   return resyncNeeded
}
```

#### listener 的 run 方法回调 EventHandler

listener 的 run 方法不断的从 nextCh 中获取 notification，并根据 notification 的类型来调用用户自定的 EventHandler

```go
func (p *processorListener) run() {
   // this call blocks until the channel is closed.  When a panic happens during the notification
   // we will catch it, **the offending item will be skipped!**, and after a short delay (one second)
   // the next notification will be attempted.  This is usually better than the alternative of never
   // delivering again.
   stopCh := make(chan struct{})
   wait.Until(func() {
      // this gives us a few quick retries before a long pause and then a few more quick retries
      err := wait.ExponentialBackoff(retry.DefaultRetry, func() (bool, error) {
         for next := range p.nextCh {
            switch notification := next.(type) {
            case updateNotification:
              // 回调用户配置的 handler
               p.handler.OnUpdate(notification.oldObj, notification.newObj)
            case addNotification:
               p.handler.OnAdd(notification.newObj)
            case deleteNotification:
               p.handler.OnDelete(notification.oldObj)
            default:
               utilruntime.HandleError(fmt.Errorf("unrecognized notification: %T", next))
            }
         }
         // the only way to get here is if the p.nextCh is empty and closed
         return true, nil
      })

      // the only way to get here is if the p.nextCh is empty and closed
      if err == nil {
         close(stopCh)
      }
   }, 1*time.Minute, stopCh)
}
```

#### addCh 到 nextCh 的对象传递

listener 中 pop 方法的逻辑相对比较绕，最终目的就是把分发到 addCh 的数据从 nextCh 或者 pendingNotifications 取出来

> notification 变量记录下一次要被放到 p.nextCh 供 pop 方法取出的对象
> 开始 seletct 时必然只有 case2 可能 ready
> Case2 做的事可以描述为：从 p.addCh 获取对象，如果临时变量 notification 还是 nil，说明需要往 notification 赋值，供 case1 推送到 p.nextCh
> 如果 notification 已经有值了，那个当前从 p.addCh 取出的值要先放到环形缓冲区中

> Case1 做的事可以描述为：看看能不能把临时变量 notification 推送到 nextCh（nil chan 会阻塞在读写操作上），可以写的话，说明这个 nextCh 是 p.nextCh，写成功之后，需要从缓存中取出一个对象放到 notification 为下次执行这个 case 做准备，如果缓存是空的，通过把 nextCh chan 设置为 nil 来禁用 case1，以便 case2 位 notification 赋值

```go
func (p *processorListener) pop() {
   defer utilruntime.HandleCrash()
   defer close(p.nextCh) // Tell .run() to stop

   //nextCh 没有利用 make 初始化，将阻塞在读和写上
   var nextCh chan<- interface{}
   //notification 初始值为 nil
   var notification interface{}
   for {
      select {
      // 执行这个 case，相当于给 p.nextCh 添加来自 p.addCh 的内容
      case nextCh <- notification:
         // Notification dispatched
         var ok bool
         //前面的 notification 已经加到 p.nextCh 了，为下一次这个 case 再次 ready 做准备
         notification, ok = p.pendingNotifications.ReadOne()
         if !ok { // Nothing to pop
            nextCh = nil // Disable this select case
         }
      //第一次 select 只有这个 case ready
      case notificationToAdd, ok := <-p.addCh:
         if !ok {
            return
         }
         if notification == nil { // No notification to pop (and pendingNotifications is empty)
            // Optimize the case - skip adding to pendingNotifications
            //为 notification 赋值
            notification = notificationToAdd
            //唤醒第一个 case
            nextCh = p.nextCh
         } else { // There is already a notification waiting to be dispatched
            //select 没有命中第一个 case，那么 notification 就没有被消耗，那么把从 p.addCh 获取的对象加到缓存中
            p.pendingNotifications.WriteOne(notificationToAdd)
         }
      }
   }
}
```
