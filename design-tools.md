# 设计工具安装指南

## 一、浏览器截图工具（推荐生成设计稿）

### 1. Puppeteer（最推荐）
```bash
# 安装
npm install -g puppeteer

# 使用示例
node screenshot.js https://your-website.com
```

**优点**：
- ✅ 完整的浏览器渲染
- ✅ 可以截图任何网页
- ✅ 支持自定义尺寸
- ✅ Node.js 原生支持

**适用场景**：
- 网页截图
- 生成设计稿预览
- 导出 HTML 为图片

---

### 2. Playwright
```bash
# 安装
npm install -g @playwright/test

# 使用示例
npx playwright screenshot https://your-website.com
```

**优点**：
- ✅ 比 Puppeteer 更快
- ✅ 支持多浏览器
- ✅ 现代化 API

---

### 3. html-to-image（轻量级）
```bash
# 安装
npm install -g html-to-image

# 使用
npx html-to-image design-preview.html output.png
```

**优点**：
- ✅ 纯 JavaScript
- ✅ 无需浏览器
- ✅ 快速生成

---

## 二、图片处理工具

### 1. ImageMagick（强大）
```bash
# 安装
apt-get update
apt-get install -y imagemagick

# 使用示例
convert input.png -resize 800x600 output.png
```

**功能**：
- 图片转换（PNG/JPG/WebP）
- 裁剪、缩放
- 滤镜效果
- 批量处理

---

### 2. Sharp（Node.js）
```bash
# 安装
npm install -g sharp-cli

# 使用
sharp-cli input.jpg --output output.png --resize 800
```

**优点**：
- ✅ 比其他库快 4-5 倍
- ✅ 内存占用小
- ✅ 支持现代格式

---

## 三、图表设计工具

### 1. Mermaid（流程图/时序图）
```bash
# 安装
npm install -g @mermaid-js/mermaid-cli

# 使用
mmdc -i flowchart.mmd -o flowchart.png
```

**适用图表**：
- 流程图
- 时序图
- 状态图
- 类图
- 甘特图

---

### 2. PlantUML（UML 图）
```bash
# 安装
apt-get install -y plantuml

# 使用
plantuml diagram.puml -tpng -o diagram.png
```

**适用图表**：
- UML 类图
- 用例图
- 组件图
- 部署图

---

## 四、矢量绘图工具

### 1. Inkscape（开源 Illustrator 替代）
```bash
# 安装
apt-get install -y inkscape

# 使用
inkscape design.svg --export-png=design.png --export-width=800
```

**优点**：
- ✅ 免费、开源
- ✅ 功能强大
- ✅ 支持所有矢量格式

---

### 2. CairoSVG（SVG 转工具）
```bash
# 安装
pip3 install cairosvg

# 使用
cairosvg design.svg -o design.png
```

---

## 五、快速生成设计稿的工具

### 方案 A：使用 HTML + Puppeteer 生成
```javascript
// screenshot.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file:///path/to/design-preview.html');
  await page.screenshot({
    path: 'design-mockup.png',
    fullPage: true,
    width: 1920,
    height: 1080
  });
  await browser.close();
})();
```

运行：
```bash
node screenshot.js
```

---

### 方案 B：使用 Puppeteer 截取真实网站
```javascript
// screenshot-website.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:4321/blogs');
  await page.screenshot({
    path: 'blogs-mockup.png',
    fullPage: true
  });
  await browser.close();
})();
```

---

## 六、我的推荐方案

### 🎯 最快方案：Puppeteer 截图预览
1. 安装 Puppeteer
2. 使用我创建的 `design-preview.html`
3. 生成设计稿图片
4. 你可以在本地查看和修改

**优点**：
- ✅ 5 分钟内完成
- ✅ 真实的浏览器渲染
- ✅ 可以反复调整

---

### 🎨 最佳方案：浏览器打开 + 截图
1. 在浏览器中打开 `design-preview.html`
2. 直接查看效果
3. 使用浏览器截图工具导出
4. 如需要，我可以调整 HTML

**优点**：
- ✅ 最简单
- ✅ 无需安装
- ✅ 实时预览

---

## 七、我可以帮你做什么

### 使用命令行工具
```bash
# 安装工具
apt-get install -y imagemagick

# 处理图片
convert *.jpg output-%d.png

# 调整尺寸
mogrify -resize 800x600 *.jpg
```

### 使用 Node.js 工具
```bash
# 安装
npm install -g puppeteer

# 截图
node screenshot.js

# 生成图片
node generate-design.js
```

### 创建设计脚本
我可以创建自动化脚本：
- 批量生成设计稿
- 批量调整图片尺寸
- 生成多尺寸预览
- 批量格式转换

---

## 八、安装建议

### 快速开始（5 分钟）
```bash
# 1. 安装 Puppeteer
npm install -g puppeteer

# 2. 使用预览文件生成截图
# 我会创建截图脚本

# 3. 查看结果
ls -lh *.png
```

### 功能完整（15 分钟）
```bash
# 1. 安装多个工具
apt-get install -y imagemagick inkscape
npm install -g puppeteer sharp-cli

# 2. 批量处理
# 批量生成设计稿
# 批量调整图片
# 批量格式转换
```

---

## 九、下一步

告诉我你想要：

### 选项 1：安装并使用 Puppeteer 🚀
- 我帮你安装 Puppeteer
- 创建截图脚本
- 生成设计稿图片

### 选项 2：安装多个工具 🛠️
- 安装 ImageMagick、Puppeteer 等
- 创建完整的图片处理流程

### 选项 3：使用现有 HTML 预览 ✨
- 直接在浏览器查看
- 我帮你调整设计
- 使用浏览器截图导出

### 选项 4：创建设计系统 🎨
- 创建 SVG 矢量设计
- 使用 Inkscape 编辑
- 导出多种格式

---

**告诉我你的选择，我马上行动！** 💪
