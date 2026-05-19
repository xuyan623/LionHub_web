# Lion Hub Linux 部署指南

## 依赖说明

| 依赖 | 必需/可选 | 用途 |
|------|----------|------|
| Python 3.10+ | **必需** | 后端服务运行环境 |
| python3-venv | **必需** | 创建虚拟环境 |
| python3-pip | **必需** | 安装 Python 包 |
| Node.js 16+ | 可选 | 仅当需要重新构建前端 |
| npm | 可选 | 仅当需要重新构建前端 |

> **注意**：前端构建产物（`dist/` 目录）已预置在仓库中，如果只是部署运行，**不需要安装 Node.js**。

---

## 系统级依赖安装

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip git

# 可选：Node.js（仅当需要修改并重新构建前端）
sudo apt install -y nodejs npm
```

### CentOS / RHEL / Rocky Linux / AlmaLinux

```bash
sudo yum install -y python3 python3-venv python3-pip git

# 可选：Node.js（仅当需要修改并重新构建前端）
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### Arch Linux / Manjaro

```bash
sudo pacman -S python python-virtualenv python-pip git

# 可选：Node.js（仅当需要修改并重新构建前端）
sudo pacman -S nodejs npm
```

### 验证 Python 版本

```bash
python3 --version  # 需 >= 3.10
```

---

## 项目部署

### 1. 克隆仓库

```bash
git clone https://github.com/xuyan623/LionHub_web.git
cd LionHub_web
```

### 2. 启动服务（推荐：使用自带脚本）

```bash
chmod +x start_server.sh
./start_server.sh start
```

脚本会自动：
- 创建 `.venv` 虚拟环境
- 安装 `requirements.txt` 中的 Python 包
- 在后台启动 Uvicorn 服务
- 绑定到 `0.0.0.0:4173`

### 3. 访问服务

- **本机**：http://127.0.0.1:4173
- **局域网其他设备**：http://`<服务器局域网IP>`:4173

---

## 常用命令

| 命令 | 作用 |
|------|------|
| `./start_server.sh start` | 启动服务（后台） |
| `./start_server.sh stop` | 停止服务 |
| `./start_server.sh restart` | 重启服务 |
| `./start_server.sh status` | 查看运行状态 |
| `./start_server.sh logs` | 查看最近 50 行日志 |
| `./start_server.sh ensure-deps` | 仅安装/更新依赖 |

---

## 手动部署（不推荐，除非脚本不可用）

```bash
# 创建虚拟环境
python3 -m venv .venv

# 激活虚拟环境
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动服务（前台运行，Ctrl+C 停止）
python3 -m uvicorn server:app --host 0.0.0.0 --port 4173

# 或后台运行
nohup python3 -m uvicorn server:app --host 0.0.0.0 --port 4173 > server.log 2>&1 &
```

---

## 防火墙配置

如果局域网设备无法访问，需要放行 4173 端口：

### UFW（Ubuntu/Debian）

```bash
sudo ufw allow 4173/tcp
sudo ufw reload
```

### firewalld（CentOS/RHEL）

```bash
sudo firewall-cmd --permanent --add-port=4173/tcp
sudo firewall-cmd --reload
```

### iptables

```bash
sudo iptables -I INPUT -p tcp --dport 4173 -j ACCEPT
sudo iptables-save
```

---

## 前端构建（仅开发者需要）

如果你修改了 `client/` 或 `frontend/` 下的源码，需要重新构建：

```bash
# 确保已安装 Node.js
npm install
npm run build:web
```

构建产物会输出到 `dist/` 目录。

---

## 数据存储

所有运行时数据存储在项目目录下：

| 路径 | 用途 |
|------|------|
| `data/lion_hub.db` | SQLite 主数据库 |
| `data/uploads/` | 上传的附件文件 |
| `data/runtime/backups/` | 自动备份文件 |
| `data/secret_admin_credentials.json` | 管理员凭据（首次启动自动生成） |

建议定期备份 `data/` 目录。

---

## 服务自启动（Systemd）

创建 `/etc/systemd/system/lionhub.service`：

```ini
[Unit]
Description=Lion Hub Local Server
After=network.target

[Service]
Type=simple
User=<你的用户名>
WorkingDirectory=/path/to/LionHub_web
ExecStart=/path/to/LionHub_web/.venv/bin/python -m uvicorn server:app --host 0.0.0.0 --port 4173
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

启用并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable lionhub
sudo systemctl start lionhub
sudo systemctl status lionhub
```
