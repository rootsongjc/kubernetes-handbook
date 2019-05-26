# 配置Kubernetes开发环境

我们将在Mac上使用docker环境编译kuberentes。

## 安装依赖

```
brew install gnu-tar
```

Docker环境，至少需要给容器分配4G内存，在低于3G内存的时候可能会编译失败。

## 执行编译

切换目录到kuberentes源码的根目录下执行：

`./build/run.sh make`可以在docker中执行跨平台编译出二进制文件。

需要用的的docker镜像：

```
gcr.io/google_containers/kube-cross:v1.7.5-2
```

我将该镜像备份到时速云上了，可供大家使用：

```
index.tenxcloud.com/jimmy/kube-cross:v1.7.5-2
```

该镜像基于Ubuntu构建，大小2.15G，编译环境中包含以下软件：

- Go1.7.5
- etcd
- protobuf
- g++
- 其他golang依赖包

在我自己的电脑上的整个编译过程大概要半个小时。

编译完成的二进制文件在`/_output/local/go/bin/`目录下。
