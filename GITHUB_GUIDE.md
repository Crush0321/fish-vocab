# GitHub 上传指南

## 方法一：使用 VS Code 直接上传（最简单）

### 1. 安装 Git
- 下载：https://git-scm.com/download
- 安装时全部默认选项即可

### 2. 初始化仓库
在 VS Code 中打开你的项目文件夹，按 `Ctrl+` ` 打开终端，执行：

```bash
# 配置你的名字和邮箱（只需一次）
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 初始化仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 摸鱼背单词插件"
```

### 3. 创建 GitHub 仓库
1. 打开 https://github.com
2. 登录你的账号
3. 点击右上角 `+` → `New repository`
4. 填写：
   - Repository name: `fish-vocab`
   - Description: `隐蔽背单词 VS Code 插件`
   - 选择 `Public`（公开）或 `Private`（私有）
   - **不要勾选** "Initialize this repository with a README"
5. 点击 `Create repository`

### 4. 推送到 GitHub
在 VS Code 终端执行：

```bash
# 连接远程仓库（将下面 URL 换成你创建的仓库地址）
git remote add origin https://github.com/你的用户名/fish-vocab.git

# 推送
git push -u origin main
# 或者如果是 master 分支
git push -u origin master
```

### 5. 完成！
刷新 GitHub 页面，代码就上传成功了。

---

## 方法二：使用 GitHub Desktop（图形界面）

1. 下载 https://desktop.github.com
2. 登录你的 GitHub 账号
3. 选择 `File` → `Add local repository`
4. 选择你的项目文件夹
5. 填写提交信息，点击 `Commit to main`
6. 点击 `Publish repository`

---

## 方法三：直接拖拽（最快，但只能传文件）

1. 在 GitHub 创建空仓库
2. 在仓库页面点击 `uploading an existing file`
3. 拖拽文件到网页上
4. 点击 `Commit changes`

---

## 上传后需要修改的文件

上传后，你需要修改 `package.json` 中的仓库地址：

```json
"repository": {
  "type": "git",
  "url": "https://github.com/你的用户名/fish-vocab"
}
```

然后重新打包：

```bash
npm run compile
npx vsce package
```

---

## 常见问题

### Q: 提示 "Permission denied"
A: 需要使用 HTTPS 或配置 SSH 密钥

### Q: 提示 "fatal: not a git repository"
A: 先执行 `git init`

### Q: 提示 "failed to push some refs"
A: 先执行 `git pull origin main` 再推送

---

**按照方法一操作即可，有问题随时问我！**
