# 云服务器 GUI 环境配置指南

## 系统信息
- **内存**: 1.6GB (使用 641MB，可用 873MB)
- **磁盘**: 40GB (使用 7.3GB，可用 30GB)
- **系统**: Ubuntu 22.04 LTS

---

## 方案选择

### 方案 1: TigerVNC + Xvfb (推荐）✨

**优点**：
- ✅ 轻量级（< 100MB 内存）
- ✅ 快速启动
- ✅ 支持浏览器访问
- ✅ 安全连接

**适用场景**：
- 远程 GUI 访问
- 运行图形工具
- 截图和设计

### 方案 2: Xvfb + Fluxbox (极简）

**优点**：
- ✅ 最轻量（< 50MB 内存）
- ✅ 极简桌面
- ✅ 无多余组件

**适用场景**：
- 仅运行 GUI 程序
- 不需要完整桌面

---

## 安装步骤

### 1. 安装 TigerVNC 服务器

```bash
# 更新包管理器
apt-get update

# 安装 TigerVNC 服务器
apt-get install -y tigervnc-standalone-server

# 安装轻量级窗口管理器
apt-get install -y fluxbox

# 安装 X11 基础库
apt-get install -y x11-xserver-utils

# 安装浏览器（用于查看预览）
apt-get install -y firefox
```

### 2. 创建 VNC 密码

```bash
# 设置 VNC 密码（替换 YOUR_PASSWORD）
vncpasswd

# 或使用以下命令一次性设置
echo "YOUR_PASSWORD" | vncpasswd -f > ~/.vnc/passwd
chmod 600 ~/.vnc/passwd
```

### 3. 配置启动脚本

```bash
# 创建 VNC 启动脚本
cat > ~/.vnc/xstartup << 'EOF'
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS

# 启动窗口管理器
startfluxbox &

# 可选：启动浏览器
# firefox &
EOF

# 添加执行权限
chmod +x ~/.vnc/xstartup
```

### 4. 启动 VNC 服务器

```bash
# 启动 VNC 服务器（端口 5901）
vncserver :1 -geometry 1920x1080 -depth 24

# 查看是否启动成功
ps aux | grep Xvnc
```

---

## 连接方式

### 方法 1: VNC 客户端（推荐）

#### 下载 VNC 客户端：

**macOS**:
```bash
# 使用 Homebrew 安装
brew install tiger-vnc

# 或下载 RealVNC
# https://www.realvnc.com/en/connect/download/vnc
```

**Windows**:
- 下载 RealVNC Viewer: https://www.realvnc.com/en/connect/download/vnc
- 或下载 TigerVNC: https://www.tightvnc.com/download.php

**Linux**:
```bash
# 安装 TigerVNC Viewer
apt-get install -y tigervnc-viewer
# 或使用 Remmina
apt-get install -y remmina
```

#### 连接步骤：
1. 打开 VNC 客户端
2. 输入服务器地址：`your-server-ip:5901`
3. 输入密码：你设置的 VNC 密码
4. 连接

### 方法 2: SSH 隧道（安全）

```bash
# 在本地机器上建立 SSH 隧道
ssh -L 5901:localhost:5901 root@your-server-ip

# 然后在 VNC 客户端连接
# 地址: localhost:5901
# 密码: VNC 密码
```

---

## 管理 VNC 服务器

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
# 停止
vncserver -kill :1

# 启动
vncserver :1 -geometry 1920x1080 -depth 24
```

### 查看状态

```bash
# 查看 VNC 进程
ps aux | grep vnc

# 查看监听端口
netstat -tuln | grep 5901
```

---

## 安全配置

### 1. 防火墙配置

```bash
# 只允许特定 IP 访问 VNC（推荐）
iptables -A INPUT -p tcp --dport 5901 -s YOUR_IP_ADDRESS -j ACCEPT
iptables -A INPUT -p tcp --dport 5901 -j DROP

# 或使用 ufw（更简单）
ufw allow from YOUR_IP_ADDRESS to any port 5901
```

### 2. 使用 SSH 隧道（最安全）

```bash
# 始终使用 SSH 隧道访问
ssh -L 5901:localhost:5901 root@your-server-ip

# 连接 localhost:5901
```

---

## 使用 GUI 工具

### 访问设计预览

```bash
# 在 VNC 桌面中打开终端
# 安装浏览器（如果还没安装）
apt-get install -y firefox

# 打开设计预览
firefox /root/.openclaw/workspace/ginlon-site/design-preview.html
```

### 使用 Pencil（如果安装成功）

```bash
# 在 VNC 桌面中打开终端
# 尝试安装 Pencil Desktop
# 注意：可能需要从官网下载

# 或使用在线工具
# 在浏览器中访问：
# - https://www.figma.com
# - https://excalidraw.com
```

---

## 故障排除

### 问题 1: 连接失败

```bash
# 检查 VNC 是否在运行
ps aux | grep vnc

# 检查端口是否开放
netstat -tuln | grep 5901

# 检查防火墙
iptables -L | grep 5901
```

### 问题 2: 无法显示中文

```bash
# 安装中文字体
apt-get install -y fonts-wqy-microhei

# 设置环境变量
export LANG=zh_CN.UTF-8
```

### 问题 3: 内存不足

```bash
# 检查内存使用
free -h

# 如果内存紧张，调整 VNC 分辨率
vncserver -kill :1
vncserver :1 -geometry 1280x720 -depth 16
```

---

## 性能优化

### 1. 使用更小的分辨率

```bash
# 减少内存使用
vncserver :1 -geometry 1024x768 -depth 16
```

### 2. 使用轻量级应用

```bash
# 使用 Firefox 而不是 Chrome
apt-get install -y firefox

# 使用 Fluxbox 而不是 GNOME/KDE
apt-get install -y fluxbox
```

### 3. 自动清理

```bash
# 创建定时任务清理缓存
crontab -e

# 添加：
# 0 2 * * * apt-get clean && apt-get autoclean
```

---

## 自动化脚本

### 创建启动脚本

```bash
# 创建便捷启动脚本
cat > /root/start-vnc.sh << 'EOF'
#!/bin/bash
echo "Starting VNC Server..."
vncserver :1 -geometry 1920x1080 -depth 24
echo "VNC Server started on port 5901"
echo "Connect to: $(curl -s ifconfig.me):5901"
EOF

chmod +x /root/start-vnc.sh
```

### 创建停止脚本

```bash
# 创建便捷停止脚本
cat > /root/stop-vnc.sh << 'EOF'
#!/bin/bash
echo "Stopping VNC Server..."
vncserver -kill :1
echo "VNC Server stopped"
EOF

chmod +x /root/stop-vnc.sh
```

### 使用脚本

```bash
# 启动
/root/start-vnc.sh

# 停止
/root/stop-vnc.sh
```

---

## 后续步骤

安装 GUI 后，你可以：

1. ✅ 访问桌面环境
2. ✅ 运行浏览器查看设计预览
3. ✅ 使用图形工具（Pencil、Figma 等）
4. ✅ 截图导出设计稿
5. ✅ 安装其他 GUI 工具

---

**安装时间**: 5-10 分钟
**内存占用**: ~100-200MB
**磁盘占用**: ~500MB
**适用场景**: 远程 GUI 访问、设计工作
