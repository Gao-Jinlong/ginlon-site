# Pencil 安装指南

## 当前环境
- **系统**: Ubuntu 22.04 LTS (Jammy Jellyfish)
- **用户**: root（服务器环境，无 GUI）

---

## 可用的安装方式

根据 Pencil 官方文档，有 4 种安装方式：

### 1. VS Code Extension（推荐用于本地开发）

#### 安装步骤：
```bash
# 如果你有 VS Code：
# 1. 打开 VS Code
# 2. 按 Cmd/Ctrl + Shift + X 打开扩展面板
# 3. 搜索 "Pencil"
# 4. 点击 Install
```

#### 验证安装：
```bash
# 创建一个测试文件
echo 'test' > test.pen

# 用 VS Code 打开
# 检查编辑器右上角是否出现 Pencil 图标
```

---

### 2. Cursor Extension（与 VS Code 类似）

#### 安装步骤：
```bash
# 如果你有 Cursor：
# 1. 打开 Cursor
# 2. 进入 Extensions
# 3. 搜索 "Pencil"
# 4. 点击 Install
```

#### 验证安装：
- 创建 `.pen` 文件
- 打开文件
- 检查是否出现 Pencil 图标

---

### 3. Desktop Application（Linux）

#### 方案 A：安装 .deb 包

```bash
# 1. 下载 Pencil .deb 包（需要从官网下载）
# 访问 https://www.pencil.dev/ 下载 Linux .deb 包

# 2. 安装包
sudo dpkg -i pencil-*.deb

# 3. 启动 Pencil
pencil
```

#### 方案 B：使用 .AppImage（推荐，无需安装）

```bash
# 1. 下载 Pencil .AppImage（需要从官网下载）

# 2. 添加执行权限
chmod +x pencil-*.AppImage

# 3. 运行
./pencil-*.AppImage
```

---

### 4. Claude Code CLI（AI 功能需要）

#### 安装步骤：
```bash
# 使用 npm 安装
npm install -g @anthropic-ai/claude-code-cli

# 或使用官方安装脚本
curl https://claude.ai/cli/install.sh | sh
```

#### 认证：
```bash
# 登录 Claude Code
claude

# 按照浏览器提示完成认证
```

#### 验证：
```bash
claude --version
```

---

## 当前环境限制

### 服务器环境问题

由于当前环境是：
- **无 GUI**（headless server）
- **无 VS Code/Cursor**（纯命令行）
- **无法运行桌面应用**

以下方式**无法**在当前环境中使用：
- ❌ VS Code Extension（需要 VS Code GUI）
- ❌ Cursor Extension（需要 Cursor GUI）
- ❌ Desktop Application（需要图形界面）

---

## 推荐的替代方案

### 方案 1：在本地机器安装 Pencil 🏠

如果你有本地开发机器（Mac/Windows/Linux with GUI）：

```bash
# 在本地机器上：
# macOS
brew install --cask pencil

# Windows
# 从官网下载安装包

# Linux
# 使用 .AppImage 或 .deb 包
```

**优点**：
- ✅ 有完整的 GUI 体验
- ✅ 可以直接在 Pencil 中设计
- ✅ 实时预览效果

---

### 方案 2：使用在线设计工具 🌐

### 推荐工具：

#### 1. Figma（推荐）
- 网站：https://www.figma.com
- 功能：强大的矢量设计工具
- 免费：有免费套餐

#### 2. Excalidraw
- 网站：https://excalidraw.com
- 功能：手绘风格绘图
- 开源：可自托管

#### 3. Draw.io
- 网站：https://app.diagrams.net
- 功能：流程图、UML 图
- 免费：完全免费

#### 4. Canva
- 网站：https://www.canva.com
- 功能：设计模板、UI 设计
- 免费：有免费版

---

### 方案 3：使用我创建的 HTML 预览 ✨

我已经创建了 `design-preview.html`，这是一个完整的设计预览：

#### 查看方式：
```bash
# 在本地浏览器中打开
cd ginlon-site
open design-preview.html
```

#### 导出图片：
```bash
# macOS
open design-preview.html
# 然后按 Cmd+Shift+4 截图

# Windows
start design-preview.html
# 然后按 Win+Shift+S 截图
```

---

### 方案 4：使用命令行工具生成设计 🛠️

#### 使用 Puppeteer 生成设计稿：

1. **安装 Puppeteer**:
```bash
npm install -g puppeteer
```

2. **创建截图脚本**:
```javascript
// screenshot.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // 设置桌面端尺寸
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('file:///path/to/design-preview.html');
  await page.screenshot({
    path: 'design-desktop.png',
    fullPage: true
  });

  // 设置移动端尺寸
  await page.setViewport({ width: 375, height: 667 });
  await page.goto('file:///path/to/design-preview.html');
  await page.screenshot({
    path: 'design-mobile.png',
    fullPage: true
  });

  await browser.close();
})();
```

3. **运行脚本**:
```bash
node screenshot.js
```

**你会得到**：
- `design-desktop.png` - 桌面端设计稿
- `design-mobile.png` - 移动端设计稿

---

## 我的建议

### 立即行动方案 🚀

1. **查看 HTML 预览**（最快）
   ```bash
   # 在本地机器上打开
   cd ginlon-site
   open design-preview.html
   ```

2. **截图导出**（简单）
   - 使用浏览器截图工具
   - 导出桌面端和移动端

3. **反馈调整**（灵活）
   - 告诉我需要调整的地方
   - 我修改 HTML，你重新截图

### 长期方案 📋

1. **在本地安装 Pencil**（完整体验）
   - macOS: `brew install --cask pencil`
   - Linux: 使用 .AppImage
   - 创建设计系统

2. **使用在线工具**（无需安装）
   - Figma（专业设计）
   - Excalidraw（快速绘图）
   - Draw.io（图表设计）

---

## 下一步选择

### 选项 1：使用 HTML 预览 + 截图 📸
- ✅ 最快，无需安装
- ✅ 立即可用
- ✅ 灵活调整

**操作**：
1. 在浏览器打开 `design-preview.html`
2. 截图导出
3. 告诉我是否满意

### 选项 2：安装 Pupppeteer 生成设计稿 🖼️
- ✅ 命令行自动化
- ✅ 可批量生成
- ✅ 精确控制尺寸

**操作**：
1. 安装 Puppeteer
2. 运行截图脚本
3. 导出 PNG 图片

### 选项 3：在本地安装 Pencil 🎨
- ✅ 完整 GUI 体验
- ✅ 实时设计
- ✅ 导出多种格式

**操作**：
1. 在本地机器安装 Pencil
2. 创建设计
3. 导出图片

### 选项 4：使用在线设计工具 🌐
- ✅ 无需安装
- ✅ 功能强大
- ✅ 团队协作

**操作**：
1. 访问 Figma
2. 创建设计
3. 导出图片

---

## 总结

由于当前是**服务器环境（无 GUI）**，Pencil 桌面应用无法直接使用。

**推荐方案**：
1. 📸 **短期**：使用 HTML 预览 + 浏览器截图
2. 🎨 **长期**：在本地安装 Pencil 或使用 Figma
3. 🛠️ **自动化**：使用 Puppeteer 生成设计稿

**告诉我你的选择，我马上帮你实现！** 💪
