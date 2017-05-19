# Docker内存资源限制 

## 一、压测工具

- [stress](http://people.seas.harvard.edu/~apw/stress/)

通过如下 Dockerfile 构建简单的测试镜像

```
➜  cat Dockerfile
FROM ubuntu:latest

RUN apt-get update && \
    apt-get install stress
➜   docker build -t ubuntu-stress:latest .
```

## 二、内存测试

- [Runtime constraints on resources](https://docs.docker.com/engine/reference/run/#runtime-constraints-on-resources)
- 目前 Docker 支持内存资源限制选项
  - `-m`, `--memory=""`Memory limit (format: `<number>[<unit>]`). Number is a positive integer. Unit can be one of `b`, `k`, `m`, or `g`. Minimum is 4M.
  - `--memory-swap=""`Total memory limit (memory + swap, format: `<number>[<unit>]`). Number is a positive integer. Unit can be one of `b`, `k`, `m`, or `g`.
  - `--memory-swappiness=""`Tune a container’s memory swappiness behavior. Accepts an integer between 0 and 100.
  - `--shm-size=""`Size of `/dev/shm`. The format is `<number><unit>`. number must be greater than 0. Unit is optional and can be `b` (bytes), `k` (kilobytes), `m` (megabytes), or `g`(gigabytes). If you omit the unit, the system uses bytes. If you omit the size entirely, the system uses `64m`.根据实际需求设置，这里不作过多的介绍
  - `--memory-reservation=""`Memory soft limit (format: `<number>[<unit>]`). Number is a positive integer. Unit can be one of `b`, `k`, `m`, or `g`.
  - `--kernel-memory=""`Kernel memory limit (format: `<number>[<unit>]`). Number is a positive integer. Unit can be one of `b`, `k`, `m`, or `g`. Minimum is 4M.kernel memory 没有特殊需求，则无需额外设置
  - `--oom-kill-disable=false`Whether to disable OOM Killer for the container or not.

默认启动一个 container，对于容器的内存是没有任何限制的。

```
➜  ~ docker help run | grep memory  # 测试 docker 版本 1.10.2，宿主系统 Ubuntu 14.04.1
  --kernel-memory                 Kernel memory limit
  -m, --memory                    Memory limit
  --memory-reservation            Memory soft limit
  --memory-swap                   Swap limit equal to memory plus swap: '-1' to enable unlimited swap
  --memory-swappiness=-1          Tune container memory swappiness (0 to 100)
➜  ~

```

### 2.1 `-m ... --memory-swap ...`

- `docker run -it --rm -m 100M --memory-swap -1 ubuntu-stress:latest /bin/bash`

指定限制内存大小并且设置 memory-swap 值为 -1，表示容器程序使用内存受限，而 swap 空间使用不受限制（宿主 swap 支持使用多少则容器即可使用多少。如果 `--memory-swap` 设置小于 `--memory`则设置不生效，使用默认设置）。

```
➜  ~ docker run -it --rm -m 100M --memory-swap -1 ubuntu-stress:latest /bin/bash
root@4b61f98e787d:/# stress --vm 1 --vm-bytes 1000M  # 通过 stress 工具对容器内存做压测
stress: info: [14] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd

```

使用 `docker stats` 查看当前容器内存资源使用：

```
➜  ~ docker stats 4b61f98e787d
CONTAINER           CPU %               MEM USAGE/LIMIT     MEM %               NET I/O
4b61f98e787d        6.74%               104.8 MB/104.9 MB   99.94%              4.625 kB/648 B

```

通过 `top` 实时监控 stress 进程内存占用：

```
➜  ~ pgrep stress
8209
8210    # 需查看 stress 子进程占用，
➜  ~ top -p 8210    # 显示可以得知 stress 的 RES 占用为 100m，而 VIRT 占用为 1007m
top - 17:51:31 up 35 min,  2 users,  load average: 1.14, 1.11, 1.06
Tasks:   1 total,   0 running,   1 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.2 us,  3.1 sy,  0.0 ni, 74.8 id, 21.9 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem:   8102564 total,  6397064 used,  1705500 free,   182864 buffers
KiB Swap: 15625212 total,  1030028 used, 14595184 free.  4113952 cached Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
 8210 root      20   0 1007.1m 100.3m   0.6m D  13.1  1.3   0:22.59 stress

```

也可以通过如下命令获取 stress 进程的 swap 占用：

```
➜  ~ for file in /proc/*/status ; do awk '/VmSwap|Name/{printf $2 " " $3}END{ print ""}' $file; done | sort -k 2 -n -r | grep stress
stress 921716 kB
stress 96 kB
➜  ~

```

- `docker run -it --rm -m 100M ubuntu-stress:latest /bin/bash`

按照官方文档的理解，如果指定 `-m` 内存限制时不添加 `--memory-swap` 选项，则表示容器中程序可以使用 100M 内存和 100M swap 内存。默认情况下，`--memory-swap` 会被设置成 memory 的 2倍。

> We set memory limit(300M) only, this means the processes in the container can use 300M memory and 300M swap memory, by default, the total virtual memory size `--memory-swap`will be set as double of memory, in this case, memory + swap would be 2*300M, so processes can use 300M swap memory as well.

如果按照以上方式运行容器提示如下信息：

```
WARNING: Your kernel does not support swap limit capabilities, memory limited without swap.

```

可参考 [Adjust memory and swap accounting](https://docs.docker.com/engine/installation/linux/ubuntulinux/) 获取解决方案:

- To enable memory and swap on system using GNU GRUB (GNU GRand Unified Bootloader), do the following:
  - Log into Ubuntu as a user with sudo privileges.
  - Edit the /etc/default/grub file.
  - Set the GRUB_CMDLINE_LINUX value as follows:
    - `GRUB_CMDLINE_LINUX="cgroup_enable=memory swapaccount=1"`
  - Save and close the file.
  - Update GRUB.
    - `$ sudo update-grub`
  - Reboot your system.

```
➜  ~ docker run -it --rm -m 100M ubuntu-stress:latest /bin/bash
root@ed670cdcb472:/# stress --vm 1 --vm-bytes 200M # 压测 200M，stress 进程会被立即 kill 掉
stress: info: [17] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd
stress: FAIL: [17] (416) <-- worker 18 got signal 9
stress: WARN: [17] (418) now reaping child worker processes
stress: FAIL: [17] (452) failed run completed in 2s
root@ed670cdcb472:/# stress --vm 1 --vm-bytes 199M

```

`docker stats` 和 top 获取资源占用情况：

```
➜  ~ docker stats ed670cdcb472
CONTAINER           CPU %               MEM USAGE / LIMIT     MEM %               NET I/O             BLOCK I/O
ed670cdcb472        13.35%              104.3 MB / 104.9 MB   99.48%              6.163 kB / 648 B    26.23 GB / 29.21 GB
➜  ~ pgrep stress
16322
16323
➜  ~ top -p 16323
top - 18:12:31 up 56 min,  2 users,  load average: 1.07, 1.07, 1.05
Tasks:   1 total,   0 running,   1 sleeping,   0 stopped,   0 zombie
%Cpu(s):  4.8 us,  4.0 sy,  0.0 ni, 69.6 id, 21.4 wa,  0.0 hi,  0.2 si,  0.0 st
KiB Mem:   8102564 total,  6403040 used,  1699524 free,   184124 buffers
KiB Swap: 15625212 total,   149996 used, 15475216 free.  4110440 cached Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
16323 root      20   0  206.1m  91.5m   0.6m D   9.9  1.2   0:52.58 stress

```

- `docker run -it -m 100M --memory-swap 400M ubuntu-stress:latest /bin/bash`

```
➜  ~ docker run -it --rm -m 100M --memory-swap 400M ubuntu-stress:latest /bin/bash
root@5ed1fd88a1aa:/# stress --vm 1 --vm-bytes 400M  # 压测到 400M 程序会被 kill
stress: info: [24] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd
stress: FAIL: [24] (416) <-- worker 25 got signal 9
stress: WARN: [24] (418) now reaping child worker processes
stress: FAIL: [24] (452) failed run completed in 3s
root@5ed1fd88a1aa:/# stress --vm 1 --vm-bytes 399M  # 压测到 399M 程序刚好可以正常运行（这个值已经处于临界了，不保证不被 kill）

```

`docker stats` 和 top 获取资源占用情况：

```
➜  ~ docker stats 5ed1fd88a1aa
CONTAINER           CPU %               MEM USAGE / LIMIT     MEM %               NET I/O             BLOCK I/O
5ed                 12.44%              104.8 MB / 104.9 MB   99.92%              4.861 kB / 648 B    9.138 GB / 10.16 GB
➜  ~ pgrep stress
22721
22722
➜  ~ top -p 22722
top - 18:18:58 up  1:02,  2 users,  load average: 1.04, 1.04, 1.05
Tasks:   1 total,   0 running,   1 sleeping,   0 stopped,   0 zombie
%Cpu(s):  1.4 us,  3.3 sy,  0.0 ni, 73.7 id, 21.6 wa,  0.0 hi,  0.1 si,  0.0 st
KiB Mem:   8102564 total,  6397416 used,  1705148 free,   184608 buffers
KiB Swap: 15625212 total,   366160 used, 15259052 free.  4102076 cached Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
22722 root      20   0  406.1m  84.1m   0.7m D  11.7  1.1   0:08.82 stress

```

根据实际测试可以理解，`-m` 为物理内存上限，而 `--memory-swap` 则是 memory + swap 之和，当压测值是 `--memory-swap` 上限时，则容器中的进程会被直接 OOM kill。

### 2.2 `-m ... --memory-swappiness ...`

swappiness 可以认为是宿主 `/proc/sys/vm/swappiness` 设定：

> Swappiness is a Linux kernel parameter that controls the relative weight given to swapping out runtime memory, as opposed to dropping pages from the system page cache. Swappiness can be set to values between 0 and 100 inclusive. A low value causes the kernel to avoid swapping, a higher value causes the kernel to try to use swap space.[Swappiness](https://en.wikipedia.org/wiki/Swappiness)

`--memory-swappiness=0` 表示禁用容器 swap 功能(这点不同于宿主机，宿主机 swappiness 设置为 0 也不保证 swap 不会被使用):

- `docker run -it --rm -m 100M --memory-swappiness=0 ubuntu-stress:latest /bin/bash`

```
➜  ~ docker run -it --rm -m 100M --memory-swappiness=0 ubuntu-stress:latest /bin/bash
root@e3fd6cc73849:/# stress --vm 1 --vm-bytes 100M  # 没有任何商量的余地，到达 100M 直接被 kill
stress: info: [18] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd
stress: FAIL: [18] (416) <-- worker 19 got signal 9
stress: WARN: [18] (418) now reaping child worker processes
stress: FAIL: [18] (452) failed run completed in 0s
root@e3fd6cc73849:/#

```

### 2.3 `--memory-reservation ...`

`--memory-reservation ...` 选项可以理解为内存的软限制。如果不设置 `-m` 选项，那么容器使用内存可以理解为是不受限的。按照官方的说法，memory reservation 设置可以确保容器不会长时间占用大量内存。

### 2.4 `--oom-kill-disable`

```
➜  ~ docker run -it --rm -m 100M --memory-swappiness=0 --oom-kill-disable ubuntu-stress:latest /bin/bash
root@f54f93440a04:/# stress --vm 1 --vm-bytes 200M  # 正常情况不添加 --oom-kill-disable 则会直接 OOM kill，加上之后则达到限制内存之后也不会被 kill
stress: info: [17] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd

```

但是如果是以下的这种没有对容器作任何资源限制的情况，添加 `--oom-kill-disable` 选项就比较 **危险** 了：

```
$ docker run -it --oom-kill-disable ubuntu:14.04 /bin/bash

```

因为此时容器内存没有限制，并且不会被 oom kill，此时系统则会 kill 系统进程用于释放内存。

### 2.5 `--kernel-memory`

> Kernel memory is fundamentally different than user memory as kernel memory can’t be swapped out. The inability to swap makes it possible for the container to block system services by consuming too much kernel memory. Kernel memory includes:

- stack pages
- slab pages
- sockets memory pressure
- tcp memory pressure

这里直接引用 Docker 官方介绍，如果无特殊需求，kernel-memory 一般无需设置，这里不作过多说明。

## 三、内存资源限制 Docker 源码解析

关于 Docker 资源限制主要是依赖 Linux cgroups 去实现的，关于 cgroups 资源限制实现可以参考：[Docker背后的内核知识——cgroups资源限制](http://www.infoq.com/cn/articles/docker-kernel-knowledge-cgroups-resource-isolation/), libcontainer 配置相关的选项：

- `github.com/opencontainers/runc/libcontainer/cgroups/fs/memory.go`

```
68 func (s *MemoryGroup) Set(path string, cgroup *configs.Cgroup) error {
69     if cgroup.Resources.Memory != 0 {
70         if err := writeFile(path, "memory.limit_in_bytes", strconv.FormatInt(cgroup.Resources.Memory, 10)); err != nil {
71             return err
72         }
73     }
74     if cgroup.Resources.MemoryReservation != 0 {
75         if err := writeFile(path, "memory.soft_limit_in_bytes", strconv.FormatInt(cgroup.Resources.MemoryReservation, 10)); err != nil {
76             return err
77         }
78     }
79     if cgroup.Resources.MemorySwap > 0 {
80         if err := writeFile(path, "memory.memsw.limit_in_bytes", strconv.FormatInt(cgroup.Resources.MemorySwap, 10)); err != nil {
81             return err   // 如果 MemorySwap 没有设置，则 cgroup 默认设定值是 Memory 2 倍，详见后文测试
82         }
83     }
84     if cgroup.Resources.OomKillDisable {
85         if err := writeFile(path, "memory.oom_control", "1"); err != nil {
86             return err
87         }
88     }
89     if cgroup.Resources.MemorySwappiness >= 0 && cgroup.Resources.MemorySwappiness <= 100 {
90         if err := writeFile(path, "memory.swappiness", strconv.FormatInt(cgroup.Resources.MemorySwappiness, 10)); err != nil {
91             return err
92         }
93     } else if cgroup.Resources.MemorySwappiness == -1 {
94         return nil  // 如果 MemorySwappiness 设置为 -1，则不做任何操作，经测试默认值为 60，后文附测试
95     } else {
96         return fmt.Errorf("invalid value:%d. valid memory swappiness range is 0-100", cgroup.Resources.MemorySwappiness)
97     }
98
99     return nil
100 }

```

附测试：

```
➜  ~ docker run -it --rm -m 100M --memory-swappiness=-1 ubuntu-stress:latest /bin/bash
root@fbe9b0abf665:/#

```

查看宿主对应 container cgroup 对应值：

```
➜  ~ cd /sys/fs/cgroup/memory/docker/fbe9b0abf665b77fff985fd04f85402eae83eb7eb7162a30070b5920d50c5356
➜  fbe9b0abf665b77fff985fd04f85402eae83eb7eb7162a30070b5920d50c5356 cat memory.swappiness           # swappiness 如果设置 -1 则该值默认为 60
60
➜  fbe9b0abf665b77fff985fd04f85402eae83eb7eb7162a30070b5920d50c5356 cat memory.memsw.limit_in_bytes # 为设置的 memory 2 倍
209715200
➜  fbe9b0abf665b77fff985fd04f85402eae83eb7eb7162a30070b5920d50c5356

```



from：http://blog.opskumu.com/docker-memory-limit.html