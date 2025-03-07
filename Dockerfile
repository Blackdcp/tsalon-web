# 使用 Node.js 官方镜像作为基础镜像
FROM m.daocloud.io/docker.io/node:alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 全局安装 hexo-cli
RUN npm install -g hexo-cli

# 复制 Hexo 项目文件
COPY . .

# 启动 Hexo 服务器
CMD ["hexo", "server"]