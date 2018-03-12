## 如何贡献

### 提 issue

如果你发现文档中的错误，或者有好的建议、不明白的问题、不要犹豫，欢迎[提交issue](https://github.com/rootsongjc/kubernetes-handbook/issues/new)。

### 发起 Pull Request

当你发现文章中明确的错误或者逻辑问题，在你自己的fork的分支中，创建一个新的branch，修改错误，push 到你的branch，然后在[提交issue](https://github.com/rootsongjc/kubernetes-handbook/issues/new) 后直接发起Pull Request。

### 贡献文档

#### 文档的组织规则

- 如果要创建一个大的主题就在最顶层创建一个目录；
- 全书五大主题，每个主题一个目录，其下不再设二级目录；
- 所有的图片都放在最顶层的 `images` 目录下，原则上文章中用到的图片都保存在本地；
- 所有的文档的文件名使用英文命名，可以包含数字和中划线；
- `etc`、`manifests`目录专门用来保存配置文件和文档中用到的其他相关文件；

#### 添加文档

1. 在该文章相关主题的目录下创建文档；
2. 在 `SUMMARY.md` 中在相应的章节下添加文章链接；
3. 执行 `gitbook serve` 测试是否报错，访问 http://localhost:4000 查看该文档是否出现在相应主题的目录下；
4. 提交PR
