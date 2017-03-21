+++
date = "2017-03-18T10:07:13+08:00"
title = "React入门"
draft = false
Tags = ["react","frontend","tool","web"]

+++

# 前言

前端无疑是2016年最火热的技术，没有之一，2017年依然🔥。现在不会点前端技术都不好意思出去见人。

各种前端mvc框架层出不穷，angular js，vue，[React](http://lib.csdn.net/base/react)，前端组件化开发概念已经深入人心。作为开发者，学习下前端设计也是有必要的，一来页面有些小的设计问题可以自己解决，同时还能提高自己的审美，提高网站的ui设计水平。

今天看到一本书《React Up and Running》的中文版本《React快速上手开发》出版了，英文版可以在[这里](http://olz1di9xf.bkt.clouddn.com/React_Up_and_Running.pdf)下载。最近我在翻译的书[Cloud Native Go](rootsongjc.github.io/talks/cloud-native-go/)中的实例也使用了React来构建Web应用程序，因此在网上找了一些React资料学习下。

## 必备基础技能

[前端技能汇总](https://github.com/JacksonTian/fks)这个项目详细记录
了前端工程师牵涉到的各方面知识。在具备基本技能之后可以在里面找到学习
的方向，完善技能和知识面。

[frontend-dev-bookmarks](https://github.com/dypsilon/frontend-dev-bookmarks)是老外总结的[前端开发](http://lib.csdn.net/base/javascript)资源。覆盖面非常广。包括各种知识点、工具、技术，非常全面。

以下是个人觉得入门阶段应该熟练掌握的基础技能：

- [HTML4](http://www.w3.org/TR/html401/cover.html#minitoc)，[HTML5](http://www.w3.org/TR/html5/#contents)语法、标签、语义
- [CSS2.1](http://www.w3.org/TR/CSS2/#minitoc)，[CSS3](http://www.w3.org/TR/2001/WD-css3-roadmap-20010523/#table)规范，与HTML结合实现各种布局、效果
- [Ecma-262](http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf)定义的javascript的语言核心，原生[客户端javascript](https://developer.mozilla.org/en-US/docs/Web/API)，[DOM操作](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)，[HTML5新增功能](https://developer.mozilla.org/en/docs/web/Guide/HTML/HTML5)
- 一个成熟的客户端javascript库，推荐[jquery](http://jquery.com/)
- 一门服务器端语言：如果有服务器端开发经验，使用已经会的语言即可，如果没有服务器端开发经验，熟悉Java可以选择Servlet，不熟悉的可以选PHP，能实现简单登陆注册功能就足够支持前端开发了，后续可能需要继续学习，最基本要求是实现简单的功能模拟，
- [HTTP](http://www.w3.org/Protocols/rfc2616/rfc2616.html)

在掌握以上基础技能之后，工作中遇到需要的技术也能快速学习。

## 基本开发工具

恰当的工具能有效提高学习效率，将重点放在知识本身，在出现问题时能快速定位并
解决问题，以下是个人觉得必备的前端开发工具：

- 文本编辑器：推荐[Sublime Text](http://www.sublimetext.com/)，支持各种插件、主题、设置，使用方便
- 浏览器：推荐[Google Chrome](http://www.google.cn/chrome/?hl=zh-CN&standalone=1)，更新快，对前端各种标准提供了非常好的支持
- 调试工具：推荐Chrome自带的[Chrome develop tools](https://developer.chrome.com/devtools)，可以轻松查看DOM结构、样式，通过控制台输出调试信息，调试javascript，查看网络等
- 辅助工具：PhotoShop编辑图片、取色，fireworks量尺寸，AlloyDesigner对比尺寸，以及前面的到的Chrome develop tools，
- 翻墙工具：Shadowsocks、云梯VPN

## 学习方法和学习目标

方法：

1. 入门阶段反复阅读经典书籍的中文版，书籍中的每一个例子都动手实现并在浏览器中查看效果
2. 在具备一定基础之后可以上网搜各种教程、demo，了解各种功能的实际用法和常见功能的实现方法
3. 阅读HTML，CSS，Javascript标准全面完善知识点
4. 阅读前端牛人的博客、文章提升对知识的理解
5. 善用搜索引擎

目标：

1. 熟记前面知识点部分的重要概念，结合学习经历得到自己的理解
2. 熟悉常见功能的实现方法，如常见CSS布局，Tab控件等。

## 入门之路

以下是入门阶段不错的书籍和资料

1. HTML先看[《HTML & CSS: Design and Build Websites》](http://www.amazon.cn/gp/product/B00BMK4GKW/ref=s9_simh_gw_p14_d0_i2?pf_rd_m=A1AJ19PSB66TGU&pf_rd_s=center-2&pf_rd_r=1AH2NF64STS19GY8GR54&pf_rd_t=101&pf_rd_p=108773272&pf_rd_i=899254051)1-9章，然后[《HTML5: The Missing Manual》](http://www.amazon.cn/HTML5%E7%A7%98%E7%B1%8D-Matthew-MacDonald/dp/B009DFCZAQ/ref=sr_1_1?ie=UTF8&qid=1414740812&sr=8-1&keywords=html5+the+missing+manual)1-4章。
2. CSS先看[《CSS: The Missing Manual》](http://www.amazon.cn/CSS-The-Missing-Manual-Mcfarland-David-Sawyer/dp/0596802447/ref=sr_1_1?ie=UTF8&qid=1414742710&sr=8-1&keywords=css+the+missing+manual+2)，然后[《CSS权威指南》](http://www.amazon.cn/CSS%E6%9D%83%E5%A8%81%E6%8C%87%E5%8D%97-%E8%BF%88%E8%80%B6/dp/B0011F5SIC/ref=sr_1_1?ie=UTF8&qid=1414744248&sr=8-1&keywords=css+%E6%9D%83%E5%A8%81%E6%8C%87%E5%8D%97)
3. javascript先看[《javascript高级程序设计》](http://www.amazon.cn/JavaScript%E9%AB%98%E7%BA%A7%E7%A8%8B%E5%BA%8F%E8%AE%BE%E8%AE%A1-%E6%B3%BD%E5%8D%A1%E6%96%AF/dp/B007OQQVMY/ref=sr_1_1?s=books&ie=UTF8&qid=1414744358&sr=1-1&keywords=javascript+%E9%AB%98%E7%BA%A7%E7%A8%8B%E5%BA%8F%E8%AE%BE%E8%AE%A1)，然后[《javascript权威指南》](http://www.amazon.cn/O-Reilly%E7%B2%BE%E5%93%81%E5%9B%BE%E4%B9%A6%E7%B3%BB%E5%88%97-JavaScript%E6%9D%83%E5%A8%81%E6%8C%87%E5%8D%97-%E5%BC%97%E5%85%B0%E7%BA%B3%E6%A0%B9/dp/B007VISQ1Y/ref=sr_1_1?s=books&ie=UTF8&qid=1414744401&sr=1-1&keywords=javascript+%E6%9D%83%E5%A8%81%E6%8C%87%E5%8D%97)
4. HTTP看[HTTP权威指南](http://www.amazon.cn/HTTP%E6%9D%83%E5%A8%81%E6%8C%87%E5%8D%97-%E5%90%89%E5%B0%94%E5%88%A9/dp/B008XFDQ14/ref=sr_1_1?s=books&ie=UTF8&qid=1414744440&sr=1-1&keywords=HTTP+%E6%9D%83%E5%A8%81%E6%8C%87%E5%8D%97)
5. 在整个学习过程中HTML CSS JavaScript会有很多地方需要互相结合，实际工作中也是这样，一个简单的功能模块都需要三者结合才能实现。
6. 动手是学习的重要组成部分，书籍重点讲解知识点，例子可能不是很充足，这就需要利用搜索引擎寻找一些简单教程，照着教程实现功能。以下是一些比较好的教程网址
   - 可以搜索各大公司前端校招笔试面试题作为练习题或者他人总结的[前端面试题](https://github.com/darcyclarke/Front-end-Developer-Interview-Questions/tree/master/Translations/Chinese)还有[个人总结的面试题](https://github.com/qiu-deqing/FE-interview)（带参考答案）
   - [http://code.tutsplus.com](http://code.tutsplus.com/)有各种各样的教程
   - [MDN](https://developer.mozilla.org/en-US/docs/Web)也有很多教程，更重要的是里面有详细的文档，需要查找某个功能时在Google搜索：`xxx site:https://developer.mozilla.org`
   - [http://www.html5rocks.com/zh/](http://www.html5rocks.com/zh/)也有很多优质教程
   - [http://www.sitepoint.com/](http://www.sitepoint.com/)
   - [http://alistapart.com/](http://alistapart.com/)
7. 原生javascript是需要重点掌握的技能，在掌握原生javascript的基础上推荐熟练掌握jQuery，在实际工作中用处很大，这方面的书籍有[《Learning jQuery》](http://www.amazon.com/Learning-jQuery-Fourth-Jonathan-Chaffer/dp/178216314X/ref=sr_1_1?s=books&ie=UTF8&qid=1410099243&sr=1-1&keywords=learning+jquery)或者去[jQuery官网](http://learn.jquery.com/)
8. 建一个[https://github.com/](https://github.com/)账号，保存平时学习中的各种代码和项目。
9. 有了一定基础之后可以搭建一个个人博客，记录学习过程中遇到的问题和解决方法，方便自己查阅也为其他人提供了帮助。也可以去[http://www.cnblogs.com/](http://www.cnblogs.com/)或者[http://www.csdn.net/](http://www.csdn.net/)这样的网站注册账号，方便实用
10. 经常实用Google搜索英文资料应该经常找到来自[http://stackoverflow.com/](http://stackoverflow.com/)的高质量答案，与到问题可以直接在这里搜索，如果有精力，注册一个账号为别人解答问题也能极大提高个人能力。
11. 经典书籍熟读之后，可以打开前面必备基础技能部分的链接。认真读对应标准，全面掌握知识

## 继续提高

有了前面的基础之后，前端基本算是入门了，这时候可能每个人心中都有了一些学习方向，如果还是没有。
可以参考前面必备技能部分提到的那两个项目，从里面选一些进行发展学习。以下是一些不错的方面：

- [Grunt](http://gruntjs.com/)：前端自动化工具，提高工作效率
- [less css](http://lesscss.org/)：优秀的CSS预处理器
- [bootstrap](http://getbootstrap.com/)：优秀的CSS框架，对没有设计师的团队很不错，与less结合使用效果完美
- [requirejs](http://requirejs.org/)：AMD规范的模块加载器，前端模块化趋势的必备工具
- [Node.js](http://nodejs.org/)：JavaScript也可以做后台，前端工程师地位更上一步
- [AngularJS](https://angularjs.org/)：做Single Page Application的好工具
- [移动端web开发](https://developer.mozilla.org/en-US/docs/Web/Guide/Mobile)：智能手机的普及让移动端的流量正在逐步赶超PC端
- [Javascript内存管理](https://developer.chrome.com/devtools/docs/javascript-memory-profiling?hl=figoogle)：SPA长期运行需要注意内存泄露的问题
- [High Performance JavaScript(Build Faster Web Application Interfaces)](http://www.amazon.com/Performance-JavaScript-Faster-Application-Interfaces/dp/059680279X/ref=sr_1_1?s=books&ie=UTF8&qid=undefined&sr=1-1&keywords=high+performance+javascript)
- [Best Practices for Speeding Up Your Web Site](https://developer.yahoo.com/performance/rules.html)：重要技能

## React开发环境配置

我在Mac下安装node支持。参考这篇文档：http://www.jianshu.com/p/20ea93641bda

直接执行一条命名就可以安装好环境：

```shell
$brew install node && \
npm install -g grunt-cli && \
npm install -g webpack
```

安装好了之后就可以Get started了。

**参考**

 [React+Webpack快速上手指南](http://www.jianshu.com/p/418e48e0cef1)

[React native中文资料](https://tianxiangbing.github.io/react-cn/docs/getting-started.html)

[阮一峰的react实例教程](http://www.ruanyifeng.com/blog/2015/03/react.html)

未完待续。。。
