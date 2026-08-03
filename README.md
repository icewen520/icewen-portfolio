# ICEWEN 个人作品集

喻佩文（Icewen）的求职作品集单页站。纯静态，无框架、无构建、无依赖。

## 文件结构

```
index.html    页面结构 + SVG 图标 sprite
styles.css    样式与响应式（所有设计变量集中在文件顶部 :root）
script.js     导航高亮、复制、音乐、菜单
assets/       图片、音频、favicon
素材/          原始素材（不参与部署）
```

## 本地预览

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

> 不建议直接双击 `index.html`。`file://` 不是安全上下文，剪贴板 API 和简历按钮的
> 文件探测都会失效，只能走降级路径。

## 部署

作品集的价值在于有个可以直接发出去的网址。任选其一，都免费且几分钟搞定：

- **Cloudflare Pages** / **Vercel**：连 GitHub 仓库，或直接把文件夹拖进去
- **GitHub Pages**：仓库 Settings → Pages → 选分支即可

部署完成后记得回到 `index.html` 把这三个分享用的 URL 换成完整域名
（微信、Twitter 抓取分享卡片时不认相对路径）：

```html
<meta property="og:image" content="https://你的域名/assets/hero-clean.jpg" />
<meta property="og:url"   content="https://你的域名/" />
<meta name="twitter:image" content="https://你的域名/assets/hero-clean.jpg" />
```

## 常用改动

### 放简历

把 PDF 存成 `assets/resume.pdf`，「下载简历 PDF」按钮会自动出现在关于页的二维码下方。
文件不存在时按钮保持隐藏，不会留下死链（逻辑在 `script.js` 的 `[data-resume]` 一段）。

### 加外部链接

在 `index.html` 的 `<div class="footer-links"></div>` 里按这个格式补：

```html
<a class="footer-link" href="https://www.zcool.com.cn/u/xxxxxx" target="_blank" rel="noopener">站酷</a>
```

### 换联系方式

页脚两个按钮的 `data-copy` 属性是复制出去的真实内容，`<span>` 里是显示文案。
手机号显示的是打码版（`159 **** 1410`），复制到剪贴板的是完整号码。

### 作品卡片接详情页

`index.html` 里四张卡片目前是 `<article class="project-card">`，没有点击入口 ——
因为还没有可点进去的案例，不做假按钮。等案例就位后改成：

```html
<a class="project-card" href="work-ai.html"> ... </a>
```

`styles.css` 里的 `a.project-card:hover` 已经写好了图片放大的 hover 态，改完自动生效。

## 字体说明

标题用的是系统自带中文衬线体，回退链是 `Songti SC → STSong → Noto Serif SC → SimSun`。
Mac 走苹方宋体，Windows 走 SimSun，两边都不会掉到 Arial。

如果想让 Windows 上的效果更接近 Mac，可以自托管**思源宋体**或**霞鹜文楷**：
标题实际只用到几十个字，用 `fonttools` 做子集化后通常 20–40KB，加一段
`@font-face` 放进 `--serif` 变量的第一位即可。
