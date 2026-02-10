# GUI 环境安装 - 详细操作指南

## 📋 安装进行中

### 当前状态
- ✅ apt-get update 已完成
- 🔄 正在安装 GUI 组件（已运行 ~3 分钟）

### 正在安装的组件
1. **tigervnc-standalone-server** - VNC 服务器
2. **fluxbox** - 轻量级窗口管理器
3. **x11-xserver-utils** - X11 图形库
4. **firefox** - Web 浏览器

### 预期完成时间
- 安装完成：~2-3 分钟后
- 总耗时：~5-8 分钟

---

## 🚀 安装完成后立即执行

### 第 1 步：设置 VNC 密码

```bash
# 设置你的 VNC 访问密码
# 输入密码：至少 6 位
# 确认密码：再次输入
vncpasswd
```

### 第 2 步：创建启动配置

```bash
# 复制启动脚本到正确位置
cp /root/.openclaw/workspace/ginlon-site/vnc-xstartup ~/.vnc/xstartup

# 添加执行权限
chmod +x ~/.vnc/xstartup
```

### 第 3 步：启动 VNC 服务器

```bash
# 启动 VNC（显示 :1，端口 5901）
# 分辨率：1920x1080
# 颜色深度：24 位
vncserver :1 -geometry 1920x1080 -depth 24

# 你会看到：
# "New 'your-hostname:1 (root)' desktop is your-hostname:1
# Starting applications specified in /root/.vnc/xstartup
# Log file is /root/.vnc/your-hostname:1.log"
```

### 第 4 步：获取服务器 IP

```bash
# 查看服务器 IP
curl -s ifconfig.me

# 或使用
ip addr show eth0 | grep inet | awk '{print $2}' | cut -d/ -f1
```

---

## 🖥️ 连接到 VNC 服务器

### 方法 A：使用 VNC 客户端（推荐）

#### 1. 下载 VNC 客户端

**macOS 用户**:
```bash
# 方案 1：使用 Homebrew
brew install --cask tigervnc-viewer

# 方案 2：下载 RealVNC
# 访问：https://www.realvnc.com/en/connect/download/vnc/mac
# 下载并安装
```

**Windows 用户**:
```bash
# 下载 RealVNC Viewer
# 访问：https://www.realvnc.com/en/connect/download/vnc/windows
# 下载并安装
```

**Linux 用户**:
```bash
# 方案 1：使用 apt
sudo apt-get install tigervnc-viewer

# 方案 2：使用 Remmina
sudo apt-get install remmina
```

#### 2. 连接步骤

1. 打开 VNC Viewer 应用
2. 输入服务器地址：
   ```
   格式：your-server-ip:5901
   示例：123.45.67.89:5901
   ```
3. 输入 VNC 密码（你设置的密码）
4. 点击连接

#### 3. 你将看到

- Fluxbox 桌面环境
- 深色背景
- 极简界面

---

### 方法 B：使用 SSH 隧道（最安全）🔒

#### 为什么推荐？

✅ **加密传输** - 所有数据通过 SSH 加密
✅ **无需开放端口** - 不需要开放 5901 端口
✅ **更安全** - 避免 VNC 直接暴露

#### 连接步骤

**步骤 1：在本地机器建立 SSH 隧道**

```bash
# macOS/Linux 终端
ssh -L 5901:localhost:5901 root@your-server-ip

# Windows PowerShell
ssh -L 5901:localhost:5901 root@your-server-ip

# 参数说明：
# -L 5901:localhost:5901  # 本地端口 5901 映射到远程 5901
# root@your-server-ip        # 你的服务器用户名和 IP
```

**步骤 2：连接到本地 VNC**

在 VNC Viewer 中：
1. 地址：`localhost:5901`
2. 密码：你的 VNC 密码
3. 连接

---

## 🎨 在 VNC 桌面中打开设计预览

连接到 VNC 后：

### 1. 打开终端

在 Fluxbox 桌面：
- 右键点击桌面
- 选择 "Terminal Emulator"

### 2. 打开设计预览

```bash
# 在终端中执行
firefox /root/.openclaw/workspace/ginlon-site/design-preview.html

# Firefox 将打开并显示改版后的设计
```

### 3. 浏览设计

- 桌面端效果（1920x1080）
- 移动端效果（在浏览器中调整窗口大小）

---

## 📸 在 VNC 中截图

### 方法 1：使用系统截图

在 Fluxbox 桌面：
1. 按 `Print Screen` 键
2. 或使用 `Shift + Print Screen`（选择区域）

### 方法 2：安装截图工具

```bash
# 在 VNC 终端中执行
apt-get install -y scrot

# 截取整个屏幕
scrot screenshot.png

# 截取选择区域
scrot -s selection.png

# 延时截图（5 秒后）
scrot -d 5 delayed.png
```

### 方法 3：使用浏览器开发工具

在 Firefox 中：
1. 打开 `design-preview.html`
2. 按 `F12` 打开开发者工具
3. 右键 → "Capture screenshot"

---

## 🔄 管理 VNC 服务器

### 常用命令

```bash
# 启动 VNC
vncserver :1 -geometry 1920x1080 -depth 24

# 停止 VNC
vncserver -kill :1

# 重启 VNC
vncserver -kill :1 && vncserver :1 -geometry 1920x1080 -depth 24

# 查看运行状态
ps aux | grep vnc

# 查看监听端口
netstat -tuln | grep 5901

# 查看 VNC 日志
tail -f ~/.vnc/$(hostname):1.log
```

### 更改分辨率

```bash
# 停止当前 VNC
vncserver -kill :1

# 以新分辨率启动
vncserver :1 -geometry 1280x720 -depth 16
```

### 更改颜色深度

```bash
# 更低的颜色深度节省内存
vncserver :1 -geometry 1920x1080 -depth 16
```

---

## 🛡️ 安全配置

### 方案 1：限制访问 IP

```bash
# 只允许特定 IP 访问 VNC 端口
iptables -A INPUT -p tcp --dport 5901 -s YOUR_IP_ADDRESS -j ACCEPT
iptables -A INPUT -p tcp --dport 5901 -j DROP

# 或使用 ufw
ufw allow from YOUR_IP_ADDRESS to any port 5901
```

### 方案 2：使用强密码

```bash
# 使用至少 8 位，包含字母、数字、特殊字符
vncpasswd

# 示例：MyVNC@2025!
```

### 方案 3：定期更改密码

```bash
# 每 30 天更改一次密码
vncpasswd
```

---

## 🐛 故障排除

### 问题 1：无法连接

```bash
# 检查 VNC 是否运行
ps aux | grep vnc

# 检查端口是否开放
netstat -tuln | grep 5901

# 检查防火墙
iptables -L | grep 5901
```

### 问题 2：连接后黑屏

```bash
# 检查日志
cat ~/.vnc/$(hostname):1.log

# 重启 VNC
vncserver -kill :1
vncserver :1 -geometry 1920x1080 -depth 24
```

### 问题 3：内存不足

```bash
# 使用更小的分辨率
vncserver :1 -geometry 1024x768 -depth 16

# 或停止其他服务
# 停止 Node.js 进程等
```

### 问题 4：Firefox 无法启动

```bash
# 使用无头模式启动 Firefox
firefox --headless /root/.openclaw/workspace/ginlon-site/design-preview.html

# 或重装 Firefox
apt-get remove firefox && apt-get install -y firefox
```

---

## 📊 性能优化建议

### 1. 使用更小分辨率

如果内存紧张（< 300MB 可用）：
```bash
# 使用 1280x720 而不是 1920x1080
vncserver :1 -geometry 1280x720 -depth 16
```

### 2. 使用 16 位颜色深度

```bash
# 16 位比 24 位节省 ~30% 内存
vncserver :1 -geometry 1920x1080 -depth 16
```

### 3. 自动清理

```bash
# 创建定时任务清理缓存
crontab -e

# 添加：
# 每天凌晨 2 点清理
0 2 * * * apt-get clean && apt-get autoclean

# 保存并退出
```

---

## 📱 使用 Pencil 或其他设计工具

### 方法 1：使用在线工具（推荐）

在 VNC 桌面的 Firefox 中访问：
- **Figma**: https://www.figma.com
- **Excalidraw**: https://excalidraw.com
- **Draw.io**: https://app.diagrams.net

### 方法 2：安装 Pencil Desktop（尝试）

```bash
# 下载 Pencil .AppImage（需要从官网下载）
# 可能需要网络连接

# 添加执行权限
chmod +x pencil-*.AppImage

# 运行
./pencil-*.AppImage
```

### 方法 3：使用已安装的 Firefox

直接在浏览器中查看设计预览，无需安装额外工具。

---

## ✅ 检查清单

安装完成后，请检查：

- [ ] VNC 服务器正在运行
- [ ] 可以连接到 VNC
- [ ] Firefox 可以打开设计预览
- [ ] 可以看到改版后的设计效果
- [ ] 可以截图保存图片

---

## 📞 需要帮助？

如果遇到问题：

1. 查看 VNC 日志：
```bash
cat ~/.vnc/$(hostname):1.log
```

2. 检查系统日志：
```bash
journalctl -xe
```

3. 重启 VNC 服务：
```bash
vncserver -kill :1
vncserver :1 -geometry 1920x1080 -depth 24
```

4. 查看我的状态：
```bash
# 我还在继续安装
ps aux | grep apt-get
```

---

**安装状态**: 🔄 进行中
**预计完成时间**: ~2-3 分钟后
**请稍等...** ⏳

完成后，你就可以：
1. 连接到服务器 GUI
2. 在浏览器中查看设计预览
3. 截图或使用设计工具

告诉我连接后看到的效果！💪
