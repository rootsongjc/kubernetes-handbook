# CNI - Container Network Interface（容器网络接口）

CNI（Container Network Interface）是 CNCF 旗下的一个项目，由一组用于配置 Linux 容器的网络接口的规范和库组成，同时还包含了一些插件。CNI 仅关心容器创建时的网络分配，和当容器被删除时释放网络资源。通过此链接浏览该项目：<https://github.com/containernetworking/cni>。

Kubernetes 源码的 `vendor/github.com/containernetworking/cni/libcni` 目录中已经包含了 CNI 的代码，也就是说 kubernetes 中已经内置了 CNI。

## 接口定义

CNI 的接口中包括以下几个方法：

```go
type CNI interface {AddNetworkList (net *NetworkConfigList, rt *RuntimeConf) (types.Result, error)
	DelNetworkList (net *NetworkConfigList, rt *RuntimeConf) error

	AddNetwork (net *NetworkConfig, rt *RuntimeConf) (types.Result, error)
	DelNetwork (net *NetworkConfig, rt *RuntimeConf) error
}
```

该接口只有四个方法，添加网络、删除网络、添加网络列表、删除网络列表。

## 设计考量

CNI 设计的时候考虑了以下问题：

- 容器运行时必须在调用任何插件之前为容器创建一个新的网络命名空间。
- 然后，运行时必须确定这个容器应属于哪个网络，并为每个网络确定哪些插件必须被执行。
- 网络配置采用 JSON 格式，可以很容易地存储在文件中。网络配置包括必填字段，如 `name` 和 `type` 以及插件（类型）。网络配置允许字段在调用之间改变值。为此，有一个可选的字段 `args`，必须包含不同的信息。
- 容器运行时必须按顺序为每个网络执行相应的插件，将容器添加到每个网络中。
- 在完成容器生命周期后，运行时必须以相反的顺序执行插件（相对于执行添加容器的顺序）以将容器与网络断开连接。
- 容器运行时不能为同一容器调用并行操作，但可以为不同的容器调用并行操作。
- 容器运行时必须为容器订阅 ADD 和 DEL 操作，这样 ADD 后面总是跟着相应的 DEL。 DEL 可能跟着额外的 DEL，但是，插件应该允许处理多个 DEL（即插件 DEL 应该是幂等的）。
- 容器必须由 ContainerID 唯一标识。存储状态的插件应该使用（网络名称，容器 ID）的主键来完成。
- 运行时不能调用同一个网络名称或容器 ID 执行两次 ADD（没有相应的 DEL）。换句话说，给定的容器 ID 必须只能添加到特定的网络一次。

## CNI 插件

CNI 插件必须实现一个可执行文件，这个文件可以被容器管理系统（例如 rkt 或 Kubernetes）调用。

CNI 插件负责将网络接口插入容器网络命名空间（例如，veth 对的一端），并在主机上进行任何必要的改变（例如将 veth 的另一端连接到网桥）。然后将 IP 分配给接口，并通过调用适当的 IPAM 插件来设置与 “IP 地址管理” 部分一致的路由。

### 参数

CNI 插件必须支持以下操作：

#### 将容器添加到网络

参数：

- **版本**调用者正在使用的 CNI 规范（容器管理系统或调用插件）的版本。
- **容器 ID**由运行时分配的容器的唯一明文标识符。一定不能是空的。
- **网络命名空间路径**要添加的网络名称空间的路径，即 `/proc/[pid]/ns/net` 或绑定挂载 / 链接。
- **网络配置**描述容器可以加入的网络的 JSON 文档。架构如下所述。
- **额外的参数**这提供了一个替代机制，允许在每个容器上简单配置 CNI 插件。
- **容器内接口的名称**这是应该分配给容器（网络命名空间）内创建的接口的名称；因此它必须符合 Linux 接口名称上的标准限制。

结果：

- **接口列表**根据插件的不同，这可以包括沙箱（例如容器或管理程序）接口名称和 / 或主机接口名称，每个接口的硬件地址以及接口所在的沙箱（如果有的话）的详细信息。
- **分配给每个接口的 IP 配置**分配给沙箱和 / 或主机接口的 IPv4 和 / 或 IPv6 地址，网关和路由。
- **DNS 信息**包含 nameserver、domain、search domain 和 option 的 DNS 信息的字典。

#### 从网络中删除容器

参数：

- **版本**调用者正在使用的 CNI 规范（容器管理系统或调用插件）的版本。
- **容器 ID**，如上所述。
- **网络命名空间路径**，如上定义。
- **网络配置**，如上所述。
- **额外的参数**，如上所述。
- **上面定义的容器**内的接口的名称。


- 所有参数应与传递给相应的添加操作的参数相同。
- 删除操作应释放配置的网络中提供的 containerid 拥有的所有资源。

报告版本

- 参数：无。
- 结果：插件支持的 CNI 规范版本信息。

```json
{“cniVersion”：“0.3.1”，// 此输出使用的 CNI 规范的版本
“supportedVersions”：[“0.1.0”，“0.2.0”，“0.3.0”，“0.3.1”] // 此插件支持的 CNI 规范版本列表
}
```

CNI 插件的详细说明请参考：[CNI SPEC](https://github.com/containernetworking/cni/blob/master/SPEC.md)。

### IP 分配

作为容器网络管理的一部分，CNI 插件需要为接口分配（并维护）IP 地址，并安装与该接口相关的所有必要路由。这给了 CNI 插件很大的灵活性，但也给它带来了很大的负担。众多的 CNI 插件需要编写相同的代码来支持用户需要的多种 IP 管理方案（例如 dhcp、host-local）。

为了减轻负担，使 IP 管理策略与 CNI 插件类型解耦，我们定义了 IP 地址管理插件（IPAM 插件）。CNI 插件的职责是在执行时恰当地调用 IPAM 插件。 IPAM 插件必须确定接口 IP/subnet，网关和路由，并将此信息返回到 “主” 插件来应用配置。 IPAM 插件可以通过协议（例如 dhcp）、存储在本地文件系统上的数据、网络配置文件的 “ipam” 部分或上述的组合来获得信息。

#### IPAM 插件

像 CNI 插件一样，调用 IPAM 插件的可执行文件。可执行文件位于预定义的路径列表中，通过 `CNI_PATH` 指示给 CNI 插件。 IPAM 插件必须接收所有传入 CNI 插件的相同环境变量。就像 CNI 插件一样，IPAM 插件通过 stdin 接收网络配置。

## 可用插件

### Main：接口创建

- **bridge**：创建网桥，并添加主机和容器到该网桥
- **ipvlan**：在容器中添加一个 [ipvlan](https://www.kernel.org/doc/Documentation/networking/ipvlan.txt) 接口
- **loopback**：创建一个回环接口
- **macvlan**：创建一个新的 MAC 地址，将所有的流量转发到容器
- **ptp**：创建 veth 对
- **vlan**：分配一个 vlan 设备

### IPAM：IP 地址分配

- **dhcp**：在主机上运行守护程序，代表容器发出 DHCP 请求
- **host-local**：维护分配 IP 的本地数据库

### Meta：其它插件

- **flannel**：根据 flannel 的配置文件创建接口
- **tuning**：调整现有接口的 sysctl 参数
- **portmap**：一个基于 iptables 的 portmapping 插件。将端口从主机的地址空间映射到容器。

## 参考

- https://github.com/containernetworking/cni
- https://github.com/containernetworking/plugins
- [Container Networking Interface Specification](https://github.com/containernetworking/cni/blob/master/SPEC.md#container-networking-interface-specification)
- [CNI Extension conventions](https://github.com/containernetworking/cni/blob/master/CONVENTIONS.md)
