# Kubctl命令概览

Kubernetes提供的kubectl命令是与集群交互最直接的方式，v1.6版本的kubectl命令参考图如下：

![kubectl cheatsheet](../images/kubernetes-kubectl-cheatsheet.png)

Kubectl的子命令主要分为8个类别：

- 基础命令（初学者都会使用的）
- 基础命令（中级）
- 部署命令
- 集群管理命令
- 故障排查和调试命令
- 高级命令
- 设置命令
- 其他命令

熟悉这些命令有助于大家来操作和管理kubernetes集群。

## 命令行提示

为了使用kubectl命令更加高效，我们可以选择安装一下开源软件来增加操作kubectl命令的快捷方式，同时为kubectl命令增加命令提示。

![增加kubeclt命令的工具（图片来自网络）](../images/tools-to-supercharge-kubectl.jpg)

- [kubectx](https://github.com/ahmetb/kubectx)：用于切换kubernetes context
- [kube-ps1](https://github.com/jonmosco/kube-ps1)：为命令行终端增加`$PROMPT`字段
- [kube-shell](https://github.com/cloudnativelabs/kube-shell)：交互式带命令提示的kubectl终端

全部配置完成后的kubectl终端如下图所示：

![增强的kubectl命令](../images/supercharged-kubectl.jpg)

### kube-shell

开源项目[kube-shell](https://github.com/cloudnativelabs/kube-shell)可以为kubectl提供自动的命令提示和补全，使用起来特别方便，推荐给大家。

Kube-shell有以下特性：

- 命令提示，给出命令的使用说明
- 自动补全，列出可选命令并可以通过tab键自动补全，支持模糊搜索
- 高亮
- 使用tab键可以列出可选的对象
- vim模式

**Mac下安装**

```bash
pip install kube-shell --user -U
```

![kube-shell页面](../images/kube-shell.jpg)

