# VS Code 插件发布指南

## 前置准备

### 1. 注册账号

#### 1.1 注册 Microsoft 账号
- 访问 https://account.microsoft.com
- 如果没有账号，点击"创建一个"
- 按提示完成注册

#### 1.2 创建 Azure DevOps 组织
- 访问 https://dev.azure.com
- 使用 Microsoft 账号登录
- 点击"New Organization"创建新组织
- 组织名称建议：`fish-vocab` 或你喜欢的名字

#### 1.3 创建 Personal Access Token (PAT)
1. 在 Azure DevOps 页面点击右上角头像 → "Personal access tokens"
2. 点击 "New Token"
3. 填写信息：
   - **Name**: `fish-vocab-publish`
   - **Organization**: `All accessible organizations`
   - **Expiration**: 选择过期时间（建议 1 年）
   - **Scopes**: 选择 `Custom defined` → 展开 `Marketplace` → 勾选 `Manage`
4. 点击 "Create"
5. **重要**: 立即复制生成的 token，关闭后就看不到了！

#### 1.4 创建 Publisher
1. 访问 https://marketplace.visualstudio.com/manage
2. 使用 Microsoft 账号登录
3. 点击 "Create Publisher"
4. 填写信息：
   - **Name**: `fish-vocab` (唯一标识，不能重复)
   - **Display Name**: `摸鱼背单词`
   - **Email**: 你的邮箱
   - 其他可选填
5. 点击 "Create"

---

## 本地准备

### 2. 安装 vsce 工具

```bash
npm install -g @vscode/vsce
```

或者使用本地安装：
```bash
npm install --save-dev @vscode/vsce
```

### 3. 登录 Publisher

```bash
vsce login <publisher-name>
# 例如：vsce login fish-vocab
```

输入之前创建的 PAT token。

---

## 发布前检查

### 4. 更新 package.json

确保以下字段正确：

```json
{
  "name": "fish-vocab",
  "displayName": "摸鱼背单词",
  "description": "隐蔽背单词，Alt+Q上一词，Alt+W下一词，Alt+E老板键一键隐藏",
  "version": "1.0.0",
  "publisher": "你的publisher名称",
  "repository": {
    "type": "git",
    "url": "https://github.com/你的用户名/fish-vocab"
  },
  "icon": "assets/icon.png",
  "keywords": ["english", "vocabulary", "word", "learning", "背单词"],
  "categories": ["Other", "Education"],
  "engines": {
    "vscode": "^1.80.0"
  },
  "activationEvents": ["*"],
  "main": "./out/extension.js"
}
```

### 5. 添加插件图标（可选但推荐）

创建 `assets/icon.png`，尺寸建议：
- 128x128 像素
- PNG 格式
- 简洁的图标设计

### 6. 更新 README.md

README 会显示在插件市场页面，需要包含：

```markdown
# 摸鱼背单词

隐蔽背单词工具，让你在写代码的同时轻松学习英语。

## 功能特点

- 🎯 **控制台伪装模式**：单词伪装成调试日志，完美隐蔽
- 🔄 **智能推荐**：基于艾宾浩斯遗忘曲线推荐单词
- ⌨️ **快捷键操作**：Alt+Q/W/E 快速切换
- 🛡️ **老板键**：一键隐藏所有学习内容
- 📚 **多词库支持**：CET4/6、考研等 500+ 单词
- ❤️ **生词本**：收藏难词重点复习

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Alt+Q | 上一个单词 |
| Alt+W | 下一个单词（智能推荐） |
| Alt+E | 老板键（隐藏/恢复） |
| Alt+D | 显示详情 |

## 使用说明

1. 安装后自动启动
2. 查看 VS Code 底部状态栏或输出面板
3. 使用快捷键切换单词
4. 点击单词或 Alt+D 查看详情

## 词库数据

- CET4 核心词：200 词
- CET6 核心词：231 词
- 考研核心词：40 词

## 隐私说明

本插件完全离线运行，不会上传任何学习数据。
```

### 7. 添加 LICENSE

创建 `LICENSE` 文件，使用 MIT 许可证：

```
MIT License

Copyright (c) 2024 [你的名字]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 打包和发布

### 8. 编译项目

```bash
npm run compile
```

### 9. 本地测试打包

```bash
vsce package
```

这会生成 `fish-vocab-1.0.0.vsix` 文件，可以本地安装测试：

```bash
# 在 VS Code 中按 Ctrl+Shift+P
# 输入 "install from vsix" 并选择生成的文件
```

### 10. 发布到市场

#### 首次发布

```bash
vsce publish
```

#### 后续更新

1. 更新 `package.json` 中的 `version` 号（遵循语义化版本：major.minor.patch）
2. 运行：

```bash
vsce publish
# 或者指定版本类型
vsce publish patch  # 1.0.0 -> 1.0.1
vsce publish minor  # 1.0.0 -> 1.1.0
vsce publish major  # 1.0.0 -> 2.0.0
```

---

## 常见问题

### Q: 提示 "Personal Access Token not found"
A: 运行 `vsce login <publisher-name>` 重新登录

### Q: 提示 "The extension already exists"
A: 说明这个插件名已被占用，需要修改 `package.json` 中的 `name` 字段

### Q: 提示 "Invalid version"
A: 版本号格式必须是 x.y.z，例如 1.0.0

### Q: 如何撤回发布？
A: 访问 https://marketplace.visualstudio.com/manage 找到插件，点击 "Unpublish"

### Q: 如何更新已发布的插件？
A: 修改版本号后再次运行 `vsce publish`

---

## 发布后的推广

1. **GitHub 仓库**
   - 创建仓库并推送代码
   - 添加 README 和截图
   - 发布 Release

2. **社交媒体**
   - 在 V2EX、知乎、掘金等平台分享
   - 写一篇文章介绍插件特点

3. **截图/GIF**
   - 准备几张使用截图
   - 制作一个简短的使用演示 GIF

---

## 相关链接

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Marketplace 管理后台](https://marketplace.visualstudio.com/manage)
- [Azure DevOps](https://dev.azure.com)

---

**祝发布顺利！🎉**
