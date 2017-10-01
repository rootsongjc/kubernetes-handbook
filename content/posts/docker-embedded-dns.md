+++
date = "2017-02-27T18:23:42+08:00"
title = "Docker内置DNS"
draft = false
categories = "containers"
Tags = ["docker","network","dns"]

+++

本文主要介绍了[Docker](http://lib.csdn.net/base/docker)容器的DNS配置及其注意点，重点对docker 1.10发布的embedded DNS server进行了源码分析，看看embedded DNS server到底是个啥，它是如何工作的。

## Configure container DNS

### DNS in default bridge network

| Options                           | Description                              |
| --------------------------------- | ---------------------------------------- |
| -h HOSTNAME or –hostname=HOSTNAME | 在该容器启动时，将HOSTNAME设置到容器内的/etc/hosts, /etc/hostname, /bin/bash提示中。 |
| –link=CONTAINER_NAME or ID:ALIAS  | 在该容器启动时，将ALIAS和CONTAINER_NAME/ID对应的容器IP添加到/etc/hosts. 如果 CONTAINER_NAME/ID有多个IP地址 ？ |
| –dns=IP_ADDRESS…                  | 在该容器启动时，将`nameserver IP_ADDRESS`添加到容器内的/etc/resolv.conf中。可以配置多个。 |
| –dns-search=DOMAIN…               | 在该容器启动时，将DOMAIN添加到容器内/etc/resolv.conf的dns search列表中。可以配置多个。 |
| –dns-opt=OPTION…                  | 在该容器启动时，将OPTION添加到容器内/etc/resolv.conf中的options选项中，可以配置多个。 |

> **说明：**
>
> - 如果docker run时不含`--dns=IP_ADDRESS..., --dns-search=DOMAIN..., or --dns-opt=OPTION...`参数，docker daemon会将copy本主机的/etc/resolv.conf，然后对该copy进行处理（将那些/etc/resolv.conf中ping不通的nameserver项给抛弃）,处理完成后留下的部分就作为该容器内部的/etc/resolv.conf。因此，如果你想利用宿主机中的/etc/resolv.conf配置的nameserver进行域名解析，那么你需要宿主机中该dns service配置一个宿主机内容器能ping通的IP。
> - 如果宿主机的/etc/resolv.conf内容发生改变，docker daemon有一个对应的file change notifier会watch到这一变化，然后根据容器状态采取对应的措施：
>   - 如果容器状态为stopped，则立刻根据宿主机的/etc/resolv.conf内容更新容器内的/etc/resolv.conf.
>   - 如果容器状态为running，则容器内的/etc/resolv.conf将不会改变，直到该容器状态变为stopped.
>   - 如果容器启动后修改过容器内的/etc/resolv.conf，则不会对该容器进行处理，否则可能会丢失已经完成的修改，无论该容器为什么状态。 
>     如果容器启动时，用了–dns, –dns-search, or –dns-opt选项，其启动时已经修改了宿主机的/etc/resolv.conf过滤后的内容，因此docker daemon永远不会更新这种容器的/etc/resolv.conf。
>   - **注意**: docker daemon监控宿主机/etc/resolv.conf的这个file change notifier的实现是依赖linux内核的inotify特性，而inotfy特性不兼容overlay fs，因此使用overlay fs driver的docker deamon将无法使用该/etc/resolv.conf自动更新的功能。

### Embedded DNS in user-defined networks

在docker 1.10版本中，docker daemon实现了一个叫做`embedded DNS server`的东西，用来当你创建的容器满足以下条件时：

- 使用自定义网络；
- 容器创建时候通过`--name`,`--network-alias` or `--link`提供了一个name；

docker daemon就会利用embedded DNS server对整个自定义网络中所有容器进行名字解析（你可以理解为一个网络中的一种服务发现）。

因此当你启动容器时候满足以上条件时，该容器的域名解析就不应该去考虑容器内的/etc/hosts, /etc/resolv.conf，应该保持其不变，甚至为空，将需要解析的域名都配置到对应embedded DNS server中。具体配置参数及说明如下：

| Options                    | Description                              |
| -------------------------- | ---------------------------------------- |
| –name=CONTAINER-NAME       | 在该容器启动时，会将CONTAINER-NAME和该容器的IP配置到该容器连接到的自定义网络中的embedded DNS server中，由它提供该自定义网络范围内的域名解析 |
| –network-alias=ALIAS       | 将容器的name-ip map配置到容器连接到的其他网络的embedded DNS server中。PS：一个容器可能连接到多个网络中。 |
| –link=CONTAINER_NAME:ALIAS | 在该容器启动时，将ALIAS和CONTAINER_NAME/ID对应的容器IP配置到该容器连接到的自定义网络中的embedded DNS server中，但仅限于配置了该link的容器能解析这条rule。 |
| –dns=[IP_ADDRESS…]         | 当embedded DNS server无法解析该容器的某个dns query时，会将请求foward到这些–dns配置的IP_ADDRESS DNS Server，由它们进一步进行域名解析。注意，这些–dns配置到`nameserver IP_ADDRESS`全部由对应的embedded DNS server管理，并不会更新到容器内的/etc/resolv.conf. |
| –dns-search=DOMAIN…        | 在该容器启动时，会将–dns-search配置的DOMAIN们配置到the embedded DNS server，并不会更新到容器内的/etc/resolv.conf。 |
| –dns-opt=OPTION…           | 在该容器启动时，会将–dns-opt配置的OPTION们配置到the embedded DNS server，并不会更新到容器内的/etc/resolv.conf。 |

> **说明：**
>
> - 如果docker run时不含`--dns=IP_ADDRESS..., --dns-search=DOMAIN..., or --dns-opt=OPTION...`参数，docker daemon会将copy本主机的/etc/resolv.conf，然后对该copy进行处理（将那些/etc/resolv.conf中ping不通的nameserver项给抛弃）,处理完成后留下的部分就作为该容器内部的/etc/resolv.conf。因此，如果你想利用宿主机中的/etc/resolv.conf配置的nameserver进行域名解析，那么你需要宿主机中该dns service配置一个宿主机内容器能ping通的IP。
> - 注意容器内/etc/resolv.conf中配置的DNS server，只有当the embedded DNS server无法解析某个name时，才会用到。

## embedded DNS server源码分析

所有embedded DNS server相关的代码都在libcontainer项目中，几个最主要的文件分别是`/libnetwork/resolver.Go`,`/libnetwork/resolver_unix.go`,`sandbox_dns_unix.go`。

OK, 先来看看embedded DNS server对象在docker中的定义：

```Go
libnetwork/resolver.go

// resolver implements the Resolver interface
type resolver struct {
    sb         *sandbox
    extDNSList [maxExtDNS]extDNSEntry
    server     *dns.Server
    conn       *net.UDPConn
    tcpServer  *dns.Server
    tcpListen  *net.TCPListener
    err        error
    count      int32
    tStamp     time.Time
    queryLock  sync.Mutex
}

// Resolver represents the embedded DNS server in Docker. It operates
// by listening on container's loopback interface for DNS queries.
type Resolver interface {
    // Start starts the name server for the container
    Start() error
    // Stop stops the name server for the container. Stopped resolver
    // can be reused after running the SetupFunc again.
    Stop()
    // SetupFunc() provides the setup function that should be run
    // in the container's network namespace.
    SetupFunc() func()
    // NameServer() returns the IP of the DNS resolver for the
    // containers.
    NameServer() string
    // SetExtServers configures the external nameservers the resolver
    // should use to forward queries
    SetExtServers([]string)
    // ResolverOptions returns resolv.conf options that should be set
    ResolverOptions() []string
}
```

可见，resolver就是embedded DNS server，每个resolver都bind一个sandbox，并定义了一个对应的dns.Server，还定义了外部DNS对象列表，但embedded DNS server无法解析某个name时，就会forward到那些外部DNS。

Resolver Interface定义了embedded DNS server必须实现的接口，这里会重点关注SetupFunc()和Start()，见下文分析。

> dns.Server的实现，全部交给github.com/miekg/dns，限于篇幅，这里我将不会跟进去分析。

从整个[Container](http://lib.csdn.net/base/docker) create的流程上来看，docker daemon对embedded DNS server的处理是从endpoint Join a sandbox开始的:

```
libnetwork/endpoint.go


func (ep *endpoint) Join(sbox Sandbox, options ...EndpointOption) error {
    ...

    return ep.sbJoin(sb, options...)
}


func (ep *endpoint) sbJoin(sb *sandbox, options ...EndpointOption) error {
    ...

    if err = sb.populateNetworkResources(ep); err != nil {
        return err
    }

    ...
}
```

sandbox join a sandbox的流程中，会调用sandbox. populateNetworkResources做网络资源的设置，这其中就包括了embedded DNS server的启动。

```Go
libnetwork/sandbox.go
func (sb *sandbox) populateNetworkResources(ep *endpoint) error {
    ...
    if ep.needResolver() {
        sb.startResolver(false)
    }
    ...
}


libnetwork/sandbox_dns_unix.go
func (sb *sandbox) startResolver(restore bool) {
    sb.resolverOnce.Do(func() {
        var err error
        sb.resolver = NewResolver(sb)
        defer func() {
            if err != nil {
                sb.resolver = nil
            }
        }()

        // In the case of live restore container is already running with
        // right resolv.conf contents created before. Just update the
        // external DNS servers from the restored sandbox for embedded
        // server to use.
        if !restore {
            err = sb.rebuildDNS()
            if err != nil {
                log.Errorf("Updating resolv.conf failed for container %s, %q", sb.ContainerID(), err)
                return
            }
        }
        sb.resolver.SetExtServers(sb.extDNS)

        sb.osSbox.InvokeFunc(sb.resolver.SetupFunc())
        if err = sb.resolver.Start(); err != nil {
            log.Errorf("Resolver Setup/Start failed for container %s, %q", sb.ContainerID(), err)
        }
    })
}
```

sandbox.startResolver是流程关键:

- 通过sanbdox.rebuildDNS生成了container内的/etc/resolv.conf
- 通过resolver.SetExtServers(sb.extDNS)设置embedded DNS server的forward DNS list
- 通过resolver.SetupFunc()启动两个随机可用端口作为embedded DNS server（127.0.0.11）的TCP和UDP Linstener
- 通过resolver.Start()对容器内的iptable进行设置(见下)，并通过miekg/dns启动一个nameserver在53端口提供服务。

下面我将逐一介绍上面的各个步骤。

### sanbdox.rebuildDNS

sanbdox.rebuildDNS负责构建容器内的resolv.conf，构建规则就是第一节江参数配置时候提到的：

- Save the external name servers in resolv.conf in the sandbox
- Add only the embedded server’s IP to container’s resolv.conf
- If the embedded server needs any resolv.conf options add it to the current list

```Go
libnetwork/sandbox_dns_unix.go

func (sb *sandbox) rebuildDNS() error {
    currRC, err := resolvconf.GetSpecific(sb.config.resolvConfPath)
    if err != nil {
        return err
    }

    // localhost entries have already been filtered out from the list
    // retain only the v4 servers in sb for forwarding the DNS queries
    sb.extDNS = resolvconf.GetNameservers(currRC.Content, types.IPv4)

    var (
        dnsList        = []string{sb.resolver.NameServer()}
        dnsOptionsList = resolvconf.GetOptions(currRC.Content)
        dnsSearchList  = resolvconf.GetSearchDomains(currRC.Content)
    )

    dnsList = append(dnsList, resolvconf.GetNameservers(currRC.Content, types.IPv6)...)

    resOptions := sb.resolver.ResolverOptions()

dnsOpt:
    ...
    dnsOptionsList = append(dnsOptionsList, resOptions...)

    _, err = resolvconf.Build(sb.config.resolvConfPath, dnsList, dnsSearchList, dnsOptionsList)
    return err
}
```

### resolver.SetExtServers

设置embedded DNS server的forward DNS list, 当embedded DNS server不能解析某name时，就会将请求forward到ExtServers。代码很简单，不多废话。

```Go
libnetwork/resolver.go
func (r *resolver) SetExtServers(dns []string) {
    l := len(dns)
    if l > maxExtDNS {
        l = maxExtDNS
    }
    for i := 0; i < l; i++ {
        r.extDNSList[i].ipStr = dns[i]
    }
}
```

### resolver.SetupFunc

启动两个随机可用端口作为embedded DNS server（127.0.0.11）的TCP和UDP Linstener。

```go
libnetwork/resolver.go

func (r *resolver) SetupFunc() func() {
    return (func() {
        var err error

        // DNS operates primarily on UDP
        addr := &net.UDPAddr{
            IP: net.ParseIP(resolverIP),
        }

        r.conn, err = net.ListenUDP("udp", addr)
        ...

        // Listen on a TCP as well
        tcpaddr := &net.TCPAddr{
            IP: net.ParseIP(resolverIP),
        }

        r.tcpListen, err = net.ListenTCP("tcp", tcpaddr)
        ...
    })
}
```

### resolver.Start

resolver.Start中两个重要步骤，分别是：

- setupIPTable设置容器内的iptables
- 启动dns nameserver在53端口开始提供域名解析服务

```
func (r *resolver) Start() error {
    ...
    if err := r.setupIPTable(); err != nil {
        return fmt.Errorf("setting up IP table rules failed: %v", err)
    }
    ...
    tcpServer := &dns.Server{Handler: r, Listener: r.tcpListen}
    r.tcpServer = tcpServer
    go func() {
        tcpServer.ActivateAndServe()
    }()
    return nil
}
```

先来看看怎么设置容器内的iptables的：

```go
func (r *resolver) setupIPTable() error {
    ...
    // 获取setupFunc()时的两个本地随机监听端口
    laddr := r.conn.LocalAddr().String()
    ltcpaddr := r.tcpListen.Addr().String()

    cmd := &exec.Cmd{
        Path:   reexec.Self(),
        // 将这两个端口传给setup-resolver命令并启动执行
        Args:   append([]string{"setup-resolver"}, r.sb.Key(), laddr, ltcpaddr),
        Stdout: os.Stdout,
        Stderr: os.Stderr,
    }
    if err := cmd.Run(); err != nil {
        return fmt.Errorf("reexec failed: %v", err)
    }
    return nil
}

// init时就注册setup-resolver对应的handler
func init() {
    reexec.Register("setup-resolver", reexecSetupResolver)
}

// setup-resolver对应的handler定义
func reexecSetupResolver() {
    ...
    // 封装iptables数据
    _, ipPort, _ := net.SplitHostPort(os.Args[2])
    _, tcpPort, _ := net.SplitHostPort(os.Args[3])
    rules := [][]string{
        {"-t", "nat", "-I", outputChain, "-d", resolverIP, "-p", "udp", "--dport", dnsPort, "-j", "DNAT", "--to-destination", os.Args[2]},
        {"-t", "nat", "-I", postroutingchain, "-s", resolverIP, "-p", "udp", "--sport", ipPort, "-j", "SNAT", "--to-source", ":" + dnsPort},
        {"-t", "nat", "-I", outputChain, "-d", resolverIP, "-p", "tcp", "--dport", dnsPort, "-j", "DNAT", "--to-destination", os.Args[3]},
        {"-t", "nat", "-I", postroutingchain, "-s", resolverIP, "-p", "tcp", "--sport", tcpPort, "-j", "SNAT", "--to-source", ":" + dnsPort},
    }
    ...

    // insert outputChain and postroutingchain
    ...
}
```

在reexecSetupResolver()中清楚的定义了iptables添加outputChain 和postroutingchain，将到容器内的dns query请求重定向到embedded DNS server(127.0.0.11)上的udp/tcp两个随机可用端口，embedded DNS server(127.0.0.11)的返回数据则重定向到容器内的53端口，这样完成了整个dns query请求。

模型图如下： 
![这里写图片描述](http://img.blog.csdn.net/20170105215440792?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvV2FsdG9uV2FuZw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

贴一张实例图： 
![这里写图片描述](http://img.blog.csdn.net/20170105215310369?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvV2FsdG9uV2FuZw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

![这里写图片描述](http://img.blog.csdn.net/20170105215322635?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvV2FsdG9uV2FuZw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

到这里，关于embedded DNS server的源码分析就结束了。当然，其中还有很多细节，就留给读者自己走读代码了。

## 福利

从该时序图中看看embedded DNS server的操作在整个容器create流程中的位置。
![这里写图片描述](http://img.blog.csdn.net/20170105215401307?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvV2FsdG9uV2FuZw==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)