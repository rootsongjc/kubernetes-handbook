# 说明

创建 Mermaid，使用 neutral 主题：

```bash
mmdc -i debugging-kubernetes-process-mermaid-zh.mmd -o debugging-kubernetes-process-mermaid-zh.svg -t neutral
mmdc -i debugging-kubernetes-process-mermaid-en.mmd -o debugging-kubernetes-process-mermaid-en.svg -t neutral
```

注意不要在 `index.md` 中插入这两个 Mermaid 代码，否则在编译网站的时候那两个生成的 SVG 又会被注入到网页中。

而且网站编译时使用的 Mermaid 主题导致这个 SVG 没法看，文字是白色的，看不清楚。