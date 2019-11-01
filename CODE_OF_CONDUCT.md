## 文档的组织规则

- 如果要创建一个大的主题就在最顶层创建一个目录；
- 全书五大主题，每个主题一个目录，其下不再设二级目录；
- 所有的图片都放在最顶层的 `images` 目录下，原则上文章中用到的图片都保存在本地；
- 所有的文档的文件名使用英文命名，可以包含数字和中划线；
- `etc`、`manifests`目录专门用来保存配置文件和文档中用到的其他相关文件；

## 添加文档

1. 在该文章相关主题的目录下创建文档；
2. 在 `SUMMARY.md` 中在相应的章节下添加文章链接；
3. 执行 `gitbook serve` 测试是否报错，访问 http://localhost:4000 查看该文档是否出现在相应主题的目录下；
4. 提交PR

## 如何使用本书

**在线浏览**

访问 https://jimmysong.io/kubernetes-handbook/

**注意：文中涉及的配置文件和代码链接在网页中将无法访问，请下载GitHub源码后，在Markdown编辑器中打开，点击链接将跳转到你的本地目录，推荐使用[typora](https://typora.io)，或者直接登录[github](https://github.com/rootsongjc/kubernetes-handbook) 查看。**

**本地查看**

1. 将代码克隆到本地
2. 安装 gitbook：[Setup and Installation of GitBook](https://github.com/GitbookIO/gitbook/blob/master/docs/setup.md)
3. 执行 gitbook serve
4. 在浏览器中访问 http://localhost:4000
5. 生成的文档在 `_book` 目录下

**Docker**

本书提供了 Docker 构建方式。

```bash
make install
make build
```

继续运行 `make serve` 即可渲染 gitbook，通过 <http://localhost:4000> 查看。

注：使用 `docker ps` 找到该容器 ID 后，使用  `docker kill $ID`  可以关掉网站。

**下载 PDF/ePub/Mobi 格式文档本地查看**

访问 [gitbook](https://www.gitbook.com/book/rootsongjc/kubernetes-handbook/details) 可以看到下载地址，可以下载根据最新文档生成的 **PDF/ePub/Mobi** 格式文档（文档的注脚中注明了更新时间），同时也可以直接在 gitbook 中阅读，不过 gitbook 不太稳定打开速度较慢，建议大家直接在 https://jimmysong.io/kubernetes-handbook/ 浏览。

**生成 pdf**

[下载Calibre](http://calibre-ebook.com/download)

- **On Mac**

在Mac下安装后，使用该命令创建链接：

```bash
ln -s /Applications/calibre.app/Contents/MacOS/ebook-convert /usr/local/bin
```

在该项目目录下执行以下命令生成`kubernetes-handbook.pdf`文档。

```bash
gitbook pdf . ./kubernetes-handbook.pdf
```

**注：因为各种依赖问题，通过 docker 方式暂时无法构建 PDF。**

- **On Windows**

需要用到的工具：[calibre](http://calibre-ebook.com/)，[phantomjs](http://phantomjs.org/download.html)

1. 将上述2个安装，calibre 默认安装的路径 `C:\Program Files\Calibre2` 为你解压路径；
2. 并将其目录均加入到系统变量 path 中,参考:目录添加到系统变量 path 中；
3. 在 cmd 打开你需要转 pdf 的文件夹,输入`gitbook pdf`即可；

**生成单个章节的pdf**

使用`pandoc`和`latex`来生成pdf格式文档。

```bash
pandoc --latex-engine=xelatex --template=pm-template input.md -o output.pdf
```