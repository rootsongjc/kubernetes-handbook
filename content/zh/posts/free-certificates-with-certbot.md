---
date: "2019-07-05T21:10:57+08:00"
draft: false
title: "使用 Certbot 为网站设置永久免费的 HTTPS 证书"
subtitle: "超简单自动化配置"
categories: "other"
tags: ["website"]
notoc: true
description: "实测推荐使用 Certbot 为网站设置永久免费的 HTTPS 证书，超简单，全程不用五分钟！"
bigimg: [{src: "https://gw.alipayobjects.com/mdn/rms_91f3e6/afts/img/A*vgIcRYO8HKEAAAAAAAAAAABkARQnAQ", desc: "Image via tatoglubilisim.com"}]
---

我的博客从上线第一天起就使用了 HTTPS，用的是 [Cloudflare](https://www.cloudflare.com/zh-cn/)，直接在其后台配置即可。如果你是用 nginx、apache、haproxy 等服务器来运行自己的网站，给大家推荐 [Certbot](https://certbot.eff.org/)，可以自动化来配置 SSL 证书和定时更新。

下面记录我自己为 [servicemesher.com](https://www.servicemesher.com) 网站配置 HTTPS 证书的过程，全程不需要 5 分钟。

## 环境

网站的托管环境如下：

- OS：CentOS 7.6 阿里云
- 网站服务器：Nginx，使用 yum 安装，版本 1.12
- 提前配置好 Nginx，确保使用 HTTP 先可以访问到网站

注意：请使用 `yum` 命令安装 nginx，这样可以确保 nginx 安装在默认的位置，因为 certbot 会检测 `/etc/nginx/` 目录下的配置文件。

## 操作步骤

执行下面的步骤可以直接为你的网站配置 HTTPS 证书。

```bash
yum -y install yum-utils
yum-config-manager --enable rhui-REGION-rhel-server-extras rhui-REGION-rhel-server-optional
yum install certbot python2-certbot-nginx
```
下图是在 Certbot 中选择服务器和操作系统的页面。

{{< gallery link="https://ww3.sinaimg.cn/large/006tNc79ly1g4oqftr4fdj31e20u0gn8.jpg" title="CertBot 页面" >}}

执行下面的命令，根据提示会自动配置 nginx。

```bash
certbot --nginx
```

然后重新加载配置。

```bash
nginx -t;nginx -s reload
```

设置证书自动更新。

```bash
echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew" | sudo tee -a /etc/crontab > /dev/null
```

好了现在访问你的网站就可以看到 https 头部加了 HTTPS 锁了。

## 参考

- [让网站永久拥有HTTPS - 申请免费SSL证书并自动续期](https://blog.csdn.net/xs18952904/article/details/79262646)
- [certbot - 免费的 https 证书](https://certbot.eff.org/lets-encrypt/centosrhel7-nginx)