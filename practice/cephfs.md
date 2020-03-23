# CephFS

Cephfs 是一个基于 ceph 集群且兼容POSIX标准的文件系统。创建 cephfs 文件系统时需要在 ceph 集群中添加 mds 服务，该服务负责处理 POSIX 文件系统中的 metadata 部分，实际的数据部分交由 ceph 集群中的 OSDs 处理。cephfs 支持以内核模块方式加载也支持 fuse 方式加载。无论是内核模式还是 fuse 模式，都是通过调用 libcephfs 库来实现 cephfs 文件系统的加载，而 libcephfs 库又调用 librados 库与 ceph 集群进行通信，从而实现 cephfs 的加载。
