#!/bin/bash

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}  Lion Hub - 醒狮战队协作中枢${NC}"
echo -e "${CYAN}  帮助菜单${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "${GREEN}[1]${NC} 强制备份数据库到 GitHub"
echo -e "${GREEN}[2]${NC} 备份数据库后同步代码并恢复"
echo -e "${GREEN}[3]${NC} 启动内网服务器"
echo -e "${GREEN}[4]${NC} 强制同步所有文件（丢弃本地修改）"
echo -e "${GREEN}[5]${NC} 穿透到公网"
echo -e "${GREEN}[0]${NC} 退出"
echo ""
read -p "请选择操作 [0-5]: " choice

case $choice in
  1)
    echo ""
    echo -e "${YELLOW}[*] 强制备份数据库到 GitHub...${NC}"
    cd ~/LionHub_web
    chmod +x backup_db.sh
    ./backup_db.sh
    ;;
  2)
    echo ""
    echo -e "${YELLOW}[*] 备份数据库后同步代码并恢复...${NC}"
    cd ~/LionHub_web
    chmod +x sync.sh
    ./sync.sh
    ;;
  3)
    echo ""
    echo -e "${YELLOW}[*] 启动内网服务器...${NC}"
    cd ~/LionHub_web
    chmod +x start_server.sh
    ./start_server.sh
    ;;
  4)
    echo ""
    echo -e "${YELLOW}[*] 强制同步所有文件...${NC}"
    cd ~/LionHub_web
    git fetch origin
    git reset --hard origin/master
    echo -e "${GREEN}[✓] 同步完成${NC}"
    ;;
  5)
    echo ""
    echo -e "${YELLOW}[*] 穿透到公网...${NC}"
    cd ~/LionHub_web
    sudo zeronews start
    ;;
  0)
    echo "退出"
    exit 0
    ;;
  *)
    echo -e "${YELLOW}[!] 无效选择${NC}"
    exit 1
    ;;
esac
