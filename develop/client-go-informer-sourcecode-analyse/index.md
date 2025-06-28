---
weight: 107
linktitle: client-go informer
title: client-go 中的 informer 源码分析
summary: 本文将以图文并茂的方式对 client-go 中的 informer 的源码进行深入分析，揭示其核心实现机制。
date: '2022-09-05T11:00:00+08:00'
type: book
---

本文将深入分析 client-go 中 informer 机制的源码实现，帮助读者理解 Kubernetes 控制器模式的核心原理。

![client-go informer](https://assets.jimmysong.io/images/book/kubernetes-handbook/develop/client-go-informer-sourcecode-analyse/client-go-informer.webp)
{width=1058 height=794}

## 前言

Kubernetes 作为云原生时代的操作系统，其声明式 API 和控制器模式是整个生态系统的基石。无论是为了深入理解 Kubernetes 的工作原理，还是基于 client-go 开发自定义控制器，掌握 informer 机制都至关重要。

client-go 是 Kubernetes 官方提供的 Go 语言客户端库，其中的 informer 机制实现了高效的资源监听和本地缓存，是构建控制器的核心组件。

### 基本使用示例

```go
// 创建 informer factory
kubeInformerFactory := kubeinformers.NewSharedInformerFactory(kubeClient, time.Second*30)

// 获取特定资源的 informer
deploymentInformer := kubeInformerFactory.Apps().V1().Deployments()
deploymentLister := deploymentInformer.Lister()

// 添加事件处理器
deploymentInformer.Informer().AddEventHandler(cache.ResourceEventHandlerFuncs{
    AddFunc: func(obj interface{}) {
        // 处理资源创建事件
    },
    UpdateFunc: func(oldObj, newObj interface{}) {
        // 处理资源更新事件
    },
    DeleteFunc: func(obj interface{}) {
        // 处理资源删除事件
    },
})

// 启动所有 informer
kubeInformerFactory.Start(stopCh)

// 等待缓存同步
kubeInformerFactory.WaitForCacheSync(stopCh)
```

## 核心组件架构

informer 机制由以下几个核心组件构成：

- **SharedInformerFactory**: 统一管理多个资源的 informer 实例
- **SharedIndexInformer**: 单个资源的 informer 实现
- **Reflector**: 负责与 API Server 交互，执行 List & Watch 操作
- **DeltaFIFO**: 增量事件队列，存储资源变更事件
- **Indexer**: 本地缓存存储，支持索引查询
- **SharedProcessor**: 事件分发器，将事件分发给注册的处理器

## SharedInformerFactory 详解

### 结构定义

```go
type sharedInformerFactory struct {
    client           kubernetes.Interface      // Kubernetes 客户端
    namespace        string                   // 监听的命名空间
    tweakListOptions internalinterfaces.TweakListOptionsFunc
    lock             sync.Mutex
    defaultResync    time.Duration           // 默认重同步周期
    customResync     map[reflect.Type]time.Duration // 自定义重同步配置
    informers        map[reflect.Type]cache.SharedIndexInformer // informer 集合
    startedInformers map[reflect.Type]bool   // 已启动的 informer 标记
}
```

### 关键方法

#### 1. 创建 Factory

```go
func NewSharedInformerFactoryWithOptions(client kubernetes.Interface, defaultResync time.Duration, options ...SharedInformerOption) SharedInformerFactory {
    factory := &sharedInformerFactory{
        client:           client,
        namespace:        v1.NamespaceAll, // 默认监听所有命名空间
        defaultResync:    defaultResync,
        informers:        make(map[reflect.Type]cache.SharedIndexInformer),
        startedInformers: make(map[reflect.Type]bool),
        customResync:     make(map[reflect.Type]time.Duration),
    }
    
    // 应用配置选项
    for _, opt := range options {
        factory = opt(factory)
    }
    
    return factory
}
```

#### 2. 启动所有 Informer

```go
func (f *sharedInformerFactory) Start(stopCh <-chan struct{}) {
    f.lock.Lock()
    defer f.lock.Unlock()

    for informerType, informer := range f.informers {
        if !f.startedInformers[informerType] {
            go informer.Run(stopCh)
            f.startedInformers[informerType] = true
        }
    }
}
```

#### 3. 等待缓存同步

```go
func (f *sharedInformerFactory) WaitForCacheSync(stopCh <-chan struct{}) map[reflect.Type]bool {
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
    for informType, informer := range informers {
        res[informType] = cache.WaitForCacheSync(stopCh, informer.HasSynced)
    }
    return res
}
```

## SharedIndexInformer 实现

### 结构定义

```go
type sharedIndexInformer struct {
    indexer                         Indexer              // 本地缓存
    controller                      Controller           // 控制器
    processor                       *sharedProcessor     // 事件处理器
    cacheMutationDetector          MutationDetector     // 缓存变更检测器
    listerWatcher                  ListerWatcher        // List & Watch 接口
    objectType                     runtime.Object       // 资源类型
    resyncCheckPeriod              time.Duration        // 重同步检查周期
    defaultEventHandlerResyncPeriod time.Duration       // 默认事件处理器重同步周期
    clock                          clock.Clock
    started, stopped               bool
    startedLock                    sync.Mutex
    blockDeltas                    sync.Mutex
}
```

### 核心运行逻辑

```go
func (s *sharedIndexInformer) Run(stopCh <-chan struct{}) {
    defer utilruntime.HandleCrash()
    
    // 创建 DeltaFIFO 队列
    fifo := NewDeltaFIFO(MetaNamespaceKeyFunc, s.indexer)
    
    // 配置控制器
    cfg := &Config{
        Queue:            fifo,
        ListerWatcher:    s.listerWatcher,
        ObjectType:       s.objectType,
        FullResyncPeriod: s.resyncCheckPeriod,
        RetryOnError:     false,
        ShouldResync:     s.processor.shouldResync,
        Process:          s.HandleDeltas, // 处理增量事件的方法
    }

    func() {
        s.startedLock.Lock()
        defer s.startedLock.Unlock()
        s.controller = New(cfg)
        s.started = true
    }()

    // 启动事件处理器
    processorStopCh := make(chan struct{})
    var wg wait.Group
    defer wg.Wait()
    defer close(processorStopCh)
    
    wg.StartWithChannel(processorStopCh, s.processor.run)

    // 启动控制器
    s.controller.Run(stopCh)
}
```

## Reflector 组件

Reflector 负责与 API Server 交互，执行 List & Watch 操作：

### List & Watch 流程

```go
func (r *Reflector) ListAndWatch(stopCh <-chan struct{}) error {
    // 1. 执行 List 操作获取全量数据
    options := metav1.ListOptions{ResourceVersion: "0"}
    
    list, err := pager.List(context.Background(), options)
    if err != nil {
        return fmt.Errorf("failed to list %v: %v", r.expectedGVK, err)
    }
    
    // 2. 将 List 结果同步到 DeltaFIFO
    listMetaInterface, err := meta.ListAccessor(list)
    resourceVersion = listMetaInterface.GetResourceVersion()
    items, err := meta.ExtractList(list)
    
    if err := r.syncWith(items, resourceVersion); err != nil {
        return fmt.Errorf("unable to sync list result: %v", err)
    }
    
    // 3. 启动 Watch 操作
    for {
        w, err := r.listerWatcher.Watch(options)
        if err != nil {
            return err
        }
        
        if err := r.watchHandler(start, w, &resourceVersion, resyncerrc, stopCh); err != nil {
            return err
        }
    }
}
```

### 定时重同步机制

```go
// 启动定时重同步
go func() {
    resyncCh, cleanup := r.resyncChan()
    defer cleanup()
    
    for {
        select {
        case <-resyncCh:
            if r.ShouldResync == nil || r.ShouldResync() {
                if err := r.store.Resync(); err != nil {
                    resyncerrc <- err
                    return
                }
            }
        case <-stopCh:
            return
        }
    }
}()
```

## DeltaFIFO 队列机制

DeltaFIFO 是 informer 的核心队列，存储资源的增量变更事件。

### 结构定义

```go
type DeltaFIFO struct {
    lock sync.RWMutex
    cond sync.Cond
    
    items map[string]Deltas          // 增量事件存储
    queue []string                   // FIFO 队列
    
    populated              bool      // 是否已填充数据
    initialPopulationCount int       // 初始数据数量
    
    keyFunc      KeyFunc             // 键值提取函数
    knownObjects KeyListerGetter     // 本地缓存引用
    
    closed     bool
    closedLock sync.Mutex
}

type Delta struct {
    Type   DeltaType    // 事件类型：Added/Updated/Deleted/Sync
    Object interface{}  // 资源对象
}

type Deltas []Delta // 同一资源的增量事件列表
```

### 关键操作

#### 1. 批量替换（Replace）

```go
func (f *DeltaFIFO) Replace(list []interface{}, resourceVersion string) error {
    f.lock.Lock()
    defer f.lock.Unlock()
    
    keys := make(sets.String, len(list))
    
    // 添加新对象
    for _, item := range list {
        key, err := f.KeyOf(item)
        if err != nil {
            return KeyError{item, err}
        }
        keys.Insert(key)
        
        if err := f.queueActionLocked(Sync, item); err != nil {
            return fmt.Errorf("couldn't enqueue object: %v", err)
        }
    }
    
    // 处理已删除的对象
    if f.knownObjects != nil {
        knownKeys := f.knownObjects.ListKeys()
        for _, k := range knownKeys {
            if keys.Has(k) {
                continue
            }
            
            deletedObj, exists, err := f.knownObjects.GetByKey(k)
            if err != nil {
                return err
            }
            if !exists {
                continue
            }
            
            if err := f.queueActionLocked(Deleted, DeletedFinalStateUnknown{k, deletedObj}); err != nil {
                return err
            }
        }
    }
    
    if !f.populated {
        f.populated = true
        f.initialPopulationCount = len(list)
    }
    
    return nil
}
```

#### 2. 弹出事件（Pop）

```go
func (f *DeltaFIFO) Pop(process PopProcessFunc) (interface{}, error) {
    f.lock.Lock()
    defer f.lock.Unlock()
    
    for {
        for len(f.queue) == 0 {
            if f.IsClosed() {
                return nil, ErrFIFOClosed
            }
            f.cond.Wait()
        }
        
        id := f.queue[0]
        f.queue = f.queue[1:]
        
        if f.initialPopulationCount > 0 {
            f.initialPopulationCount--
        }
        
        item, ok := f.items[id]
        if !ok {
            continue
        }
        
        delete(f.items, id)
        err := process(item)
        
        if e, ok := err.(ErrRequeue); ok {
            f.addIfNotPresent(id, item)
            err = e.Err
        }
        
        return item, err
    }
}
```

## 本地缓存 Indexer

Indexer 提供了支持索引的本地缓存实现：

### 核心结构

```go
type threadSafeMap struct {
    lock     sync.RWMutex
    items    map[string]interface{}  // 对象存储
    indexers Indexers               // 索引函数映射
    indices  Indices                // 索引数据
}

type Indexers map[string]IndexFunc  // 索引名称 -> 索引函数
type Indices map[string]Index       // 索引名称 -> 索引数据
type Index map[string]sets.String   // 索引值 -> 对象键集合
```

### 索引维护

```go
func (c *threadSafeMap) updateIndices(oldObj interface{}, newObj interface{}, key string) {
    // 删除旧对象的索引
    if oldObj != nil {
        c.deleteFromIndices(oldObj, key)
    }
    
    // 为新对象建立索引
    for name, indexFunc := range c.indexers {
        indexValues, err := indexFunc(newObj)
        if err != nil {
            panic(fmt.Errorf("unable to calculate index entry for key %q on index %q: %v", key, name, err))
        }
        
        index := c.indices[name]
        if index == nil {
            index = Index{}
            c.indices[name] = index
        }
        
        for _, indexValue := range indexValues {
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

### 常用索引函数

```go
// 命名空间索引
func MetaNamespaceIndexFunc(obj interface{}) ([]string, error) {
    meta, err := meta.Accessor(obj)
    if err != nil {
        return []string{""}, fmt.Errorf("object has no meta: %v", err)
    }
    return []string{meta.GetNamespace()}, nil
}

// 标签索引示例
func LabelIndexFunc(labelKey string) IndexFunc {
    return func(obj interface{}) ([]string, error) {
        meta, err := meta.Accessor(obj)
        if err != nil {
            return []string{""}, err
        }
        
        labels := meta.GetLabels()
        if labels == nil {
            return []string{""}, nil
        }
        
        if value, exists := labels[labelKey]; exists {
            return []string{value}, nil
        }
        return []string{""}, nil
    }
}
```

## 事件处理机制

### HandleDeltas 方法

```go
func (s *sharedIndexInformer) HandleDeltas(obj interface{}) error {
    s.blockDeltas.Lock()
    defer s.blockDeltas.Unlock()

    // 处理每个增量事件
    for _, d := range obj.(Deltas) {
        switch d.Type {
        case Sync, Added, Updated:
            isSync := d.Type == Sync
            
            // 更新本地缓存
            if old, exists, err := s.indexer.Get(d.Object); err == nil && exists {
                if err := s.indexer.Update(d.Object); err != nil {
                    return err
                }
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

### SharedProcessor 事件分发

```go
func (p *sharedProcessor) distribute(obj interface{}, sync bool) {
    p.listenersLock.RLock()
    defer p.listenersLock.RUnlock()
    
    if sync {
        // 同步事件只分发给需要重同步的监听器
        for _, listener := range p.syncingListeners {
            listener.add(obj)
        }
    } else {
        // 普通事件分发给所有监听器
        for _, listener := range p.listeners {
            listener.add(obj)
        }
    }
}
```

## 最佳实践

### 1. 合理设置重同步周期

```go
// 根据业务需求设置合适的重同步周期
factory := kubeinformers.NewSharedInformerFactory(client, 30*time.Second)

// 为特定资源设置不同的重同步周期
factory = kubeinformers.NewSharedInformerFactoryWithOptions(
    client, 
    30*time.Second,
    kubeinformers.WithCustomResyncConfig(map[v1.Object]time.Duration{
        &appsv1.Deployment{}: 10 * time.Minute,
        &corev1.Pod{}:        5 * time.Minute,
    }),
)
```

### 2. 优雅的错误处理

```go
deploymentInformer.Informer().AddEventHandler(cache.ResourceEventHandlerFuncs{
    AddFunc: func(obj interface{}) {
        deployment, ok := obj.(*appsv1.Deployment)
        if !ok {
            utilruntime.HandleError(fmt.Errorf("expected Deployment, got %T", obj))
            return
        }
        // 处理逻辑
    },
    UpdateFunc: func(oldObj, newObj interface{}) {
        // 确保对象类型正确
        oldDeployment, ok := oldObj.(*appsv1.Deployment)
        if !ok {
            return
        }
        newDeployment, ok := newObj.(*appsv1.Deployment)
        if !ok {
            return
        }
        
        // 避免处理无意义的更新
        if oldDeployment.ResourceVersion == newDeployment.ResourceVersion {
            return
        }
        
        // 处理逻辑
    },
})
```

### 3. 使用 Lister 进行高效查询

```go
// 使用 Lister 从本地缓存查询，避免直接调用 API Server
deploymentLister := factory.Apps().V1().Deployments().Lister()

// 查询特定命名空间的资源
deployments, err := deploymentLister.Deployments("default").List(labels.Everything())

// 查询具有特定标签的资源
selector, _ := labels.Parse("app=nginx")
deployments, err := deploymentLister.List(selector)
```

## 总结

client-go 的 informer 机制通过精巧的设计实现了高效的资源监听和本地缓存：

1. **SharedInformerFactory** 统一管理多个资源的 informer，避免重复创建
2. **Reflector** 负责与 API Server 交互，实现 List & Watch 操作
3. **DeltaFIFO** 作为事件队列，保证事件处理的顺序性和可靠性
4. **Indexer** 提供高效的本地缓存和索引查询能力
5. **SharedProcessor** 实现事件的多路分发

理解这些组件的协作机制，有助于我们更好地使用 client-go 构建稳定高效的 Kubernetes 控制器。
