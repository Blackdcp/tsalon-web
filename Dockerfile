# 使用 Node.js 官方镜像作为基础镜像
FROM m.daocloud.io/docker.io/node:alpine

# 安装 git（Alpine 镜像默认不带 git）
RUN apk add --no-cache git

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

# 安装主题（假设你的主题是 git 仓库）
RUN git submodule update --init --recursive

RUN hexo clean && hexo generate

# 启动 Hexo 服务器
CMD ["hexo", "server", "-i", "0.0.0.0"]