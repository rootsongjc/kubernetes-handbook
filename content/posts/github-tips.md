---
title: "Git常用命令与GitHub使用技巧技巧整理"
description: "Git常用命令与GitHub使用技巧日常使用命令整理"
date: 2017-10-10T17:55:36+08:00
draft: false
categories: "github"
tags: ["github","git"]
---

**1. GitHub中同步远程分支**

查看本地已有分支

```bash
git remote -v
```

增加远程分支

```bash
git remote add upstream https://github.com/k8smeetup/kubernetes.github.io.git
git fetch upstream
git checkout master
git merge upstream/master
```
**2. 更新Git代码并对比**

```bash
git remote -v
git fetch origin master
git log -p master.. origin/master
git merge origin/master
```

**3. 删除远程分支**

```Bash
git push origin --delete <branchName>
git push origin --delete tag <tagName>
```

