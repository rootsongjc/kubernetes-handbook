# Docker IO资源限制 

## 一、压测工具

通过 Linux `dd` 命令测试

## 二、IO 测试

- [Runtime constraints on resources](https://docs.docker.com/engine/reference/run/#runtime-constraints-on-resources)
- 关于 IO 的限制
  - `--blkio-weight=0`Block IO weight (relative weight) accepts a weight value between 10 and 1000.
  - `--blkio-weight-device=""`Block IO weight (relative device weight, format: `DEVICE_NAME:WEIGHT`)针对特定设备的权重比
  - `--device-read-bps=""`Limit read rate from a device (format: `<device-path>:<number>[<unit>]`). Number is a positive integer. Unit can be one of `kb`, `mb`, or `gb`.按每秒读取块设备的数据量设定上限
  - `--device-write-bps=""`Limit write rate from a device (format: `<device-path>:<number>[<unit>]`). Number is a positive integer. Unit can be one of `kb`, `mb`, or `gb`.按每秒写入块设备的数据量设定上限
  - `--device-read-iops=""`Limit read rate (IO per second) from a device (format: `<device-path>:<number>`). Number is a positive integer.按照每秒读操作次数设定上限
  - `--device-write-iops=""`Limit write rate (IO per second) from a device (format: `<device-path>:<number>`). Number is a positive integer.按照每秒写操作次数设定上限

```
➜  ~ docker help run | grep -E 'bps|IO'
Usage:  docker run [OPTIONS] IMAGE [COMMAND] [ARG...]
  --blkio-weight                  Block IO (relative weight), between 10 and 1000
  --blkio-weight-device=[]        Block IO weight (relative device weight)
  --device-read-bps=[]            Limit read rate (bytes per second) from a device
  --device-read-iops=[]           Limit read rate (IO per second) from a device
  --device-write-bps=[]           Limit write rate (bytes per second) to a device
  --device-write-iops=[]          Limit write rate (IO per second) to a device
➜  ~

```

### 2.1 `--blkio-weight`、`--blkio-weight-device`

- `--blkio-weight`

默认，所有的容器对于 IO 操作「block IO bandwidth – blkio」都拥有相同优先级。可以通过 `--blkio-weight` 修改容器 blkio 权重。`--blkio-weight` 权重值在 10 ~ 1000 之间。

> Note: The blkio weight setting is only available for direct IO. Buffered IO is not currently supported.

使用 blkio weight 还需要注意 IO 的调度必须为 CFQ：

```
➜  ~ cat /sys/block/sda/queue/scheduler
noop [deadline] cfq
➜  ~ sudo sh -c "echo cfq > /sys/block/sda/queue/scheduler"
➜  ~ cat /sys/block/sda/queue/scheduler
noop deadline [cfq]

```

按照 Docker 官方文档的介绍测试：

```
➜  ~ docker run -it --rm --blkio-weight 100 ubuntu-stress:latest /bin/bash
root@0b6770ee80e0:/#
➜  ~ docker run -it --rm --blkio-weight 1000 ubuntu-stress:latest /bin/bash
root@6778b6b39686:/#

```

在运行的容器上同时执行如下命令，统计测试时间：

```
root@0b6770ee80e0:/# time dd if=/dev/zero of=test.out bs=1M count=1024 oflag=direct
1024+0 records in
1024+0 records out
1073741824 bytes (1.1 GB) copied, 122.442 s, 8.8 MB/s

real    2m2.524s
user    0m0.008s
sys     0m0.492s
root@6778b6b39686:/# time dd if=/dev/zero of=test.out bs=1M count=1024 oflag=direct
1024+0 records in
1024+0 records out
1073741824 bytes (1.1 GB) copied, 122.493 s, 8.8 MB/s

real    2m2.574s
user    0m0.020s
sys     0m0.480s
root@6778b6b39686:/#

```

测试下来，效果不是很理想，没有获得官档的效果，类似的问题可以在相关的 issue 上找到，如 [–blkio-weight doesn’t take effect in docker Docker version 1.8.1 #16173](https://github.com/docker/docker/issues/16173)

官方的测试说明是：

> You’ll find that the proportion of time is the same as the proportion of blkio weights of the two containers.

- `--blkio-weight-device="DEVICE_NAME:WEIGHT"`

`--blkio-weight-device` 可以指定某个设备的权重大小，如果同时指定 `--blkio-weight` 则以 `--blkio-weight` 为全局默认配置，针对指定设备以 `--blkio-weight-device` 指定设备值为主。

```
➜  ~ docker run -it --rm --blkio-weight-device "/dev/sda:100" ubuntu-stress:latest /bin/bash

```

### 2.2 `--device-read-bps`、`--device-write-bps`

限制容器的写入速度是 1mb「`<device-path>:<limit>[unit]`，单位可以是 kb、mb、gb 正整数」:

```
➜  ~ docker run -it --rm --device-write-bps /dev/sda:1mb ubuntu-stress:latest /bin/bash
root@ffa51b81987c:/# dd if=/dev/zero of=test.out bs=1M count=100 oflag=direct
100+0 records in
100+0 records out
104857600 bytes (105 MB) copied, 100.064 s, 1.0 MB/s    # 可以得知写入的平均速度是 1.0 MB/s

```

通过 iotop 获取测试过程中的 bps 也是 1.0 MB 为上限：

![io write bps](http://blog.opskumu.com/images/io-write-bps.png)

读 bps 限制使用方式同写 bps 限制：

```
➜  ~ docker run -it --rm --device-read-bps /dev/sda:1mb ubuntu-stress:latest /bin/bash

```

### 2.3 `--device-read-iops`、`--device-write-iops`

限制容器 write iops 为 5「`<device-path>:<limit>`，必须为正整数」：

```
➜  ~ docker run -it --rm --device-write-iops /dev/sda:5 ubuntu-stress:latest /bin/bash
root@c2a2fa232594:/# dd if=/dev/zero of=test.out bs=1M count=100 oflag=direct
100+0 records in
100+0 records out
104857600 bytes (105 MB) copied, 42.6987 s, 2.5 MB/s

```

通过 `iostat` 监控 tps「此处即为 iops」 基本上持续在 10 左右「会有些偏差」：

```
➜  ~ iostat 1
... ...
avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           1.13    0.00    0.13   23.46    0.00   75.28

Device:            tps    kB_read/s    kB_wrtn/s    kB_read    kB_wrtn
sda              10.00         0.00      2610.00          0       5220
... ...

```

读 iops 限制使用方式同写 iops 限制：

```
➜  ~ docker run -it --rm --device-read-iops /dev/sda:5 ubuntu-stress:latest /bin/bash

```

**注：** 在容器中通过 `dd` 测试读速度并没有看到很好的效果，经查没有找到磁盘读操作的好工具，所以文中没有介绍读测试。

## 三、源码解析

- [github.com/opencontainers/runc/libcontainer/cgroups/fs](https://github.com/opencontainers/runc/tree/master/libcontainer/cgroups/fs)blkio.go

libcontainer 主要操作是对 cgroup 下相关文件根据选项写操作，具体更进一步的资源限制操作可以看 cgroup 的实现方式。

## 四、拓展

- [Docker背后的内核知识——cgroups资源限制](http://www.infoq.com/cn/articles/docker-kernel-knowledge-cgroups-resource-isolation)
- [cgroup 内存、IO、CPU、网络资源管理](http://pan.baidu.com/share/home?uk=1429463486&view=share#category/type=0)

From:http://blog.opskumu.com/docker-io-limit.html