# Docker CPU资源限制 

## 一、压测工具

使用 stress 测试。

## 二、CPU 测试

- [Runtime constraints on resources](https://docs.docker.com/engine/reference/run/#runtime-constraints-on-resources)
- 目前 Docker 支持 CPU 资源限制选项
  - `-c`, `--cpu-shares=0`CPU shares (relative weight)-c 选项将会废弃，推荐使用 `--cpu-shares`
  - `--cpu-period=0`Limit the CPU CFS (Completely Fair Scheduler) period
  - `--cpuset-cpus=""`CPUs in which to allow execution (0-3, 0,1)
  - `--cpuset-mems=""`Memory nodes (MEMs) in which to allow execution (0-3, 0,1). Only effective on NUMA systems.
  - `--cpu-quota=0`Limit the CPU CFS (Completely Fair Scheduler) quota

```
➜  ~ docker help run | grep cpu
  --cpu-shares                    CPU shares (relative weight)
  --cpu-period                    Limit CPU CFS (Completely Fair Scheduler) period
  --cpu-quota                     Limit CPU CFS (Completely Fair Scheduler) quota
  --cpuset-cpus                   CPUs in which to allow execution (0-3, 0,1)
  --cpuset-mems                   MEMs in which to allow execution (0-3, 0,1)

```

### 2.1 CPU share constraint: `-c` or `--cpu-shares`

默认所有的容器对于 CPU 的利用占比都是一样的，`-c` 或者 `--cpu-shares` 可以设置 CPU 利用率权重，默认为 1024，可以设置权重为 2 或者更高(单个 CPU 为 1024，两个为 2048，以此类推)。如果设置选项为 0，则系统会忽略该选项并且使用默认值 1024。通过以上设置，只会在 CPU 密集(繁忙)型运行进程时体现出来。当一个 container 空闲时，其它容器都是可以占用 CPU 的。cpu-shares 值为一个相对值，实际 CPU 利用率则取决于系统上运行容器的数量。

假如一个 1core 的主机运行 3 个 container，其中一个 cpu-shares 设置为 1024，而其它 cpu-shares 被设置成 512。当 3 个容器中的进程尝试使用 100% CPU 的时候「尝试使用 100% CPU 很重要，此时才可以体现设置值」，则设置 1024 的容器会占用 50% 的 CPU 时间。如果又添加一个 cpu-shares 为 1024 的 container，那么两个设置为 1024 的容器 CPU 利用占比为 33%，而另外两个则为 16.5%。简单的算法就是，所有设置的值相加，每个容器的占比就是 CPU 的利用率，如果只有一个容器，那么此时它无论设置 512 或者 1024，CPU 利用率都将是 100%。当然，如果主机是 3core，运行 3 个容器，两个 cpu-shares 设置为 512，一个设置为 1024，则此时每个 container 都能占用其中一个 CPU 为 100%。

测试主机「4core」当只有 1 个 container 时，可以使用任意的 CPU：

```
➜  ~ docker run -it --rm --cpu-shares 512 ubuntu-stress:latest /bin/bash
root@4eb961147ba6:/# stress -c 4
stress: info: [17] dispatching hogs: 4 cpu, 0 io, 0 vm, 0 hdd
➜  ~ docker stats 4eb961147ba6
CONTAINER           CPU %               MEM USAGE / LIMIT     MEM %               NET I/O             BLOCK I/O
4eb961147ba6        398.05%             741.4 kB / 8.297 GB   0.01%               4.88 kB / 648 B     0 B / 0 B

```

测试两个 container，一个设置为 3072，一个设置 1024，CPU 占用如下：

![cpu test](http://blog.opskumu.com/images/cpu-test.png)

### 2.2 CPU period constraint: `--cpu-period` & `--cpu-quota`

默认的 CPU CFS「Completely Fair Scheduler」period 是 100ms。我们可以通过 `--cpu-period` 值限制容器的 CPU 使用。一般 `--cpu-period` 配合 `--cpu-quota` 一起使用。

设置 cpu-period 为 100ms，cpu-quota 为 200ms，表示最多可以使用 2 个 cpu，如下测试：

```
➜  ~ docker run -it --rm --cpu-period=100000 --cpu-quota=200000 ubuntu-stress:latest /bin/bash
root@6b89f2bda5cd:/# stress -c 4    # stress 测试使用 4 个 cpu
stress: info: [17] dispatching hogs: 4 cpu, 0 io, 0 vm, 0 hdd
➜  ~ docker stats 6b89f2bda5cd      # stats 显示当前容器 CPU 使用率不超过 200%
CONTAINER           CPU %               MEM USAGE / LIMIT     MEM %               NET I/O             BLOCK I/O
6b89f2bda5cd        200.68%             745.5 kB / 8.297 GB   0.01%               4.771 kB / 648 B    0 B / 0 B

```

通过以上测试可以得知，`--cpu-period` 结合 `--cpu-quota` 配置是固定的，无论 CPU 是闲还是繁忙，如上配置，容器最多只能使用 2 个 CPU 到 100%。

- [CFS documentation on bandwidth limiting](https://www.kernel.org/doc/Documentation/scheduler/sched-bwc.txt)

### 2.3 Cpuset constraint: `--cpuset-cpus`、`--cpuset-mems`

#### `--cpuset-cpus`

通过 `--cpuset-cpus` 可以绑定指定容器使用指定 CPU：

设置测试容器只能使用 cpu1 和 cpu3，即最多使用 2 个 固定的 CPU 上：

```
➜  ~ docker run -it --rm --cpuset-cpus="1,3" ubuntu-stress:latest /bin/bash
root@9f1fc0e11b6f:/# stress -c 4
stress: info: [17] dispatching hogs: 4 cpu, 0 io, 0 vm, 0 hdd
➜  ~ docker stats 9f1fc0e11b6f
CONTAINER           CPU %               MEM USAGE / LIMIT     MEM %               NET I/O             BLOCK I/O
9f1fc0e11b6f        199.16%             856.1 kB / 8.297 GB   0.01%               4.664 kB / 648 B    0 B / 0 B
➜  ~ top    # 宿主机 CPU 使用情况
top - 12:43:55 up  3:18,  3 users,  load average: 3.20, 2.54, 1.82
Tasks: 211 total,   3 running, 207 sleeping,   1 stopped,   0 zombie
%Cpu0  :  0.7 us,  0.3 sy,  0.0 ni, 99.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu1  :100.0 us,  0.0 sy,  0.0 ni,  0.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu2  :  0.7 us,  0.3 sy,  0.0 ni, 99.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu3  :100.0 us,  0.0 sy,  0.0 ni,  0.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
... ...

```

以下表示容器可以利用 CPU1、CPU2 和 CPU3：

```
➜  ~ docker run -it --rm --cpuset-cpus="1-3" ubuntu-stress:latest /bin/bash

```

#### `--cpuset-mems`

`--cpuset-mems` 只应用于 NUMA 架构的 CPU 生效，关于这个选项这里不过多介绍。关于 NUMA 架构可以参考这篇文章 [NUMA架构的CPU – 你真的用好了么？](http://cenalulu.github.io/linux/numa/)。

## 三、源码解析

- [github.com/opencontainers/runc/libcontainer/cgroups/fs](https://github.com/opencontainers/runc/tree/master/libcontainer/cgroups/fs)
  - cpu.go
  - cpuset.go
  - cpuacct.go

libcontainer 只是根据设定值写 cgroup 文件，这部分没有什么逻辑性的解释。

From:http://blog.opskumu.com/docker-cpu-limit.html