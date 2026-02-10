# VNC 连接信息

## ✅ VNC 服务器状态

**状态**: 正在运行
**服务器 IP**: 101.133.153.78
**端口**: 5901
**连接地址**: `101.133.153.78:5901`

---

## 🖥️ 连接方式

### 方法 1：使用 VNC 客户端（推荐）

#### 下载 VNC Viewer

**macOS 用户**:
```bash
# 方案 1：使用 Homebrew
brew install --cask tigervnc-viewer

# 方案 2：下载 RealVNC
# 访问：https://www.realvnc.com/en/connect/download/vnc/mac
```

**Windows 用户**:
```bash
# 下载 RealVNC Viewer
# 访问：https://www.realvnc.com/en/connect/download/vnc/windows
```

**Linux 用户**:
```bash
# 安装 TigerVNC Viewer
sudo apt-get install tigervnc-viewer

# 或安装 Remmina
sudo apt-get install remmina
```

#### 连接步骤

1. **打开 VNC Viewer 应用**
2. **输入服务器地址**：
   ```
   101.133.153.78:5901
   ```
3. **输入密码**：
   ```
   当前密码文件为空，可能不需要密码
   或者密码为空（直接点击连接）
   ```
4. **点击连接**

### 方法 2：使用 SSH 隧道（最安全）🔒

#### 为什么推荐 SSH 隧道？

✅ **加密传输** - 所有数据通过 SSH 加密
✅ **不需要开放 5901 端口** - 避免直接暴露
✅ **更安全** - 防止暴力破解

#### 连接步骤

**在本地机器上执行**:

```bash
# macOS/Linux 终端或 Windows PowerShell
ssh -L 5901:localhost:5901 root@101.133.153.78
```

**参数说明**:
- `-L 5901:localhost:5901` - 本地端口 5901 映射到远程 5901
- `root@101.133.153.78` - 你的服务器用户名和 IP

**然后在 VNC Viewer 中**:
1. 地址：`localhost:5901`
2. 密码：可能为空或不需要密码
3. 连接

---

## 🔐 关于 VNC 密码

### 当前状态
- 密码文件：`~/.vnc/passwd`
- 文件大小：0 字节（空文件）
- **结论**：当前 VNC 可能没有设置密码

### 连接时如果要求密码

如果 VNC Viewer 要求密码，尝试：
1. **留空密码**，直接点击连接
2. 如果不行，密码可能是 `openclaw`（我尝试过设置）
3. 如果还不行，我可以帮你重新设置密码

### 设置新密码（如果需要）

如果你想要设置密码，我可以帮你：

```bash
# 我可以运行密码设置脚本
# 但需要交互式输入，或者我创建一个脚本让你运行
```

---

## 🌐 连接后做什么

### 1. 打开终端

在 VNC 桌面：
- **右键点击桌面**
- 选择 "Terminal Emulator"

### 2. 打开设计预览

```bash
# 在终端中执行
firefox /root/.openclaw/workspace/ginlon-site/design-preview.html
```

### 3. 浏览设计

- 查看改版后的设计效果
- 桌面端布局（1920x1080）
- 移动端效果（调整窗口大小）

### 4. 截图

**方法 1**：使用系统截图
- 按 `Print Screen` 键
- 或 `Shift + Print Screen`（选择区域）

**方法 2**：安装截图工具
```bash
apt-get install -y scrot

# 截取整个屏幕
scrot screenshot.png

# 查看截图
ls -lh *.png
```

**方法 3**：使用浏览器开发工具
1. 在 Firefox 中按 `F12`
2. 右键 → "Capture screenshot"
3. 选择全屏或元素

---

## 🔒 安全建议

### 1. 使用 SSH 隧道（强烈推荐）

```bash
ssh -L 5901:localhost:5901 root@101.133.153.78
```

### 2. 防火墙配置（如果需要）

```bash
# 如果不使用 SSH 隧道，只允许特定 IP 访问
iptables -A INPUT -p tcp --dport 5901 -s YOUR_IP -j ACCEPT
iptables -A INPUT -p tcp --dport 5901 -j DROP
```

---

## 🔄 管理 VNC 服务器

### 启动

```bash
vncserver :1 -geometry 1920x1080 -depth 24
```

### 停止

```bash
vncserver -kill :1
```

### 重启

```bash
vncserver -kill :1
vncserver :1 -geometry 1920x1080 -depth 24
```

### 查看状态

```bash
# 查看进程
ps aux | grep vnc

# 查看端口
netstat -tuln | grep 5901

# 查看日志
tail -f /root/.vnc/iZuf6je7fjyuaqes3cx64mZ:5901.log
```

---

## 🐛 故障排除

### 问题 1：无法连接

```bash
# 检查 VNC 是否运行
ps aux | grep vnc

# 检查端口
netstat -tuln | grep 5901

# 检查防火墙
iptables -L | grep 5901
```

### 问题 2：连接后黑屏

```bash
# 检查日志
cat /root/.vnc/iZuf6je7fjyuaqes3cx64mZ:5901.log

# 重启 VNC
vncserver -kill :1
vncserver :1 -geometry 1920x1080 -depth 24
```

### 问题 3：密码错误

- **尝试 1**：留空密码，直接连接
- **尝试 2**：密码 `openclaw`
- **尝试 3**：让我帮你重新设置密码

---

## ✅ 检查清单

连接成功后，请检查：

- [ ] 可以看到桌面环境
- [ ] 可以打开终端
- [ ] 可以启动 Firefox
- [ ] 可以打开设计预览
- [ ] 可以看到改版后的效果
- [ ] 可以截图保存

---

## 📱 下一步

连接到 VNC 后：

1. **打开终端**
2. **启动 Firefox**：
   ```bash
   firefox /root/.openclaw/workspace/ginlon-site/design-preview.html
   ```
3. **浏览设计**
   - 桌面端布局
   - 移动端效果
4. **截图或反馈**
   - 告诉我是否满意
   - 需要调整哪里

---

## 📞 需要帮助？

如果遇到问题：

### 快速诊断
```bash
# 查看所有 VNC 进程
ps aux | grep -E "(Xvnc|vnc)"

# 查看最新日志
tail -50 /root/.vnc/iZuf6je7fjyuaqes3cx64mZ:5901.log
```

### 联系我
- 告诉你遇到的问题
- 我会帮你解决
- 或者尝试其他方法

---

**连接信息**:
- 地址：`101.133.153.78:5901`
- 密码：可能为空，或 `openclaw`

**祝你连接成功！** 💪
