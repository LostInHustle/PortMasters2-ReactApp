# 港口大师 2：生产环境部署指南

> 🌐 **双语文档** | [🇬🇧 View English](DEPLOYMENT_GUIDE.md)

这篇文档记录了港口大师 2 上线到 `https://www.portmasters2.guru/` 之后，登录和注册功能为什么会失效，
排查过程中遇到的每一个问题，以及最后是怎么解决的。重点是讲清楚背后的原因，而不只是列一遍步骤。

---

## 1. 最初的现象

所有访问这个网址的人都卡在了登录/注册页面，点"登录"或"创建账号"之后什么都不会发生。

## 2. 真正的根源（和表面看到的不一样）

随手翻一下代码，会发现两个地方写着 `localhost:8080`
（[apps/client/vite.config.ts](apps/client/vite.config.ts) 和
[apps/server/src/main.ts](apps/server/src/main.ts)），很容易让人以为问题就出在这儿。其实不是。
这两处只是开发环境用的默认值：一个是 Vite 开发代理的目标地址，一个是本地端口的兜底值。这两个值在生产环境
里本来就不会被用到，改了它们也不会有任何变化。

真正的问题出在架构层面，不是哪里写错了字。

后端（[apps/server](apps/server)）是一个长期运行的单个 Node 进程。它启动了一个 `http.createServer`，
又在同一个端口上挂了一个 `ws` 的 `WebSocketServer`，所有游戏状态（房间、对局、谁在线）都保存在这个进程
的内存里，只要进程不停，状态就一直在。可以参考
[createHttpServer.ts](apps/server/src/http/createHttpServer.ts)。

Vercel 跑不了这种进程。Vercel Functions 是短生命周期、无状态的：每次请求才启动，请求处理完就结束，
不会一直保持一个 socket 连接，也不会在两次请求之间留住内存里的状态。没有任何设置能让
`ws.WebSocketServer` 在上面跑起来，这是平台本身的限制，不是哪里配错了。

由于仓库里没有 `vercel.json`，没有 `/api` 目录，也没有 Dockerfile，Vercel 实际上一直只在构建和提供
React 前端（`apps/client`）。后端从来没有真正部署到任何地方。登录表单发出去的请求，根本没有人接。

值得一提的是，前端代码本身其实已经为这种部署方式写好了。
[WsContext.tsx](apps/client/src/ws/WsContext.tsx) 是用 `window.location.host` 动态拼出 WebSocket
地址的，没有写死任何东西。问题不在这段逻辑，而是生产环境里这个域名背后根本没有服务器。

## 3. 解决思路：把前后端分开部署

Vercel 在这里只擅长一件事（提供 React 静态构建产物），不擅长另一件事（运行一个持续在线的有状态进程），
所以解法就是把两者分开：

- **前端**继续放在 **Vercel** 上，不需要改动，它本来就能正常提供页面。
- **后端**搬到 **Railway** 上，这是一个能真正运行持久 Node 进程、原生支持 WebSocket 的平台。

这样一来，前端和后端就分别在两个不同的域名上了，因此需要做几处代码改动：

| 文件 | 改动 | 原因 |
|---|---|---|
| [WsContext.tsx](apps/client/src/ws/WsContext.tsx) | `wsUrl()` 现在会先读取 `import.meta.env.VITE_WS_URL`，如果设置了就用它，没设置就照旧退回到同域的 `/ws` | 前端和后端不再是同一个域名，所以前端需要知道服务器的具体地址。退回同域逻辑保留了本地开发时原来的行为，不受影响。 |
| [main.ts](apps/server/src/main.ts) | 新增 `USERS_FILE_PATH` 环境变量，没设置时退回原来的本地路径 | Railway 每次重新部署都会清空容器里的磁盘。账号数据需要存到挂载的持久化磁盘（Volume）上，所以这个路径得能从外部配置。 |
| [createHttpServer.ts](apps/server/src/http/createHttpServer.ts) | 新增 `ALLOWED_ORIGINS` 环境变量，通过 `ws` 库的 `verifyClient` 选项限制哪些来源可以建立 WebSocket 连接 | 服务器现在有了自己独立的公开地址，如果不限制，任何网站都可以拿这个地址去连接。锁定到自己的域名是生产环境更安全的默认做法。不设置这个变量时允许任何来源连接，和原来的行为一致，本地开发够用。 |
| 新增 `railway.json` | 把 Railway 的构建命令锁定为 `npm install`，启动命令锁定为 `npm run start -w @pm2/server` | 没有这个文件，Railway 的自动检测会连前端也一起构建，不仅浪费资源，后面会看到这其实还会出问题（见第 3 个问题）。 |
| 新增 `apps/client/.env.example` | 写明 `VITE_WS_URL` 这个变量的用法 | 免得以后还要重新摸索一遍。 |

现有的 246 个测试、类型检查、lint 全部照常通过，这次改动纯粹是新增配置，没有动到任何游戏逻辑。

## 4. 问题一："分支明明已经合并了，我改的东西去哪了？"

**发生了什么：** 在改这些部署相关代码的同时，另一个早就在进行中的发布分支
（`release/pm2-react-v1.0.0b2`）通过 PR #5 合并进了 `main`。而部署修复的那些改动，当时还只是工作区里
没有提交的修改，所以它们并不属于任何一个分支。

**为什么看起来很吓人：** `git merge-base --is-ancestor HEAD main` 显示当前分支不是 main 的祖先，
这个结果没错，但没有提交的文件修改本来就不属于任何一次提交，所以它们根本不会跟着分支一起走。只要没有被
`stash` 或者撤销，无论切换到哪个分支，这些修改都会一直留在工作区里。

**怎么解决的：** 重新切到最新的 `main`（`git checkout main && git pull`），在它基础上新建一个分支
（`fix/vercel-railway-split`），没提交的修改会自动带过去（只要改动的文件不冲突，git 在切分支时会保留
工作区里的修改）。在新分支上提交、推送，开了 PR #6，合并进 `main`。东西完全没丢，只是它原本就没绑定在
任何分支上。

**经验：** 没提交的修改不属于任何特定分支。如果想清楚记录某次改动是为哪个分支准备的，最好早点提交。

## 5. 问题二：Railway 的项目列表是空的

**发生了什么：** 登录 Railway 之后，项目列表里什么都没有，尽管之前感觉已经走过一遍"创建项目"的流程了。

**原因：** 项目创建其实从来没有真正完成，很可能是 GitHub App 授权那一步被中断或者跳过了。

**怎么解决的：** 不再相信仪表盘上显示的内容，直接打开 `railway.app/new`，选择 "Deploy from GitHub
repo"，把 GitHub App 的授权完整走完（授权访问这个仓库），然后从弹出的列表里选中这个仓库。这次才真正
建出了一个项目，并且服务也确实开始构建了。

## 6. 问题三：Railway 建出了两个服务，而不是一个

**发生了什么：** Railway 自动识别出这是一个 npm workspaces 的 monorepo，把它拆成了两个服务，一个根
目录指向 `apps/client`，另一个指向 `apps/server`，而不是直接使用仓库根目录的 `railway.json`。

这会带来两个问题。`apps/client` 这个服务完全是多余的：Vercel 已经在提供前端了，Railway 上这份多出来
的拷贝根本连不到任何真实的东西。更重要的是，如果某个服务的 Root Directory 被限定在 `apps/server`
里面，那么在这个目录下执行 `npm install` 是没法解析 `"@pm2/shared": "*"` 这个依赖的，因为这是一个
npm workspaces 的内部链接，只有从仓库根目录执行 `npm install` 才能正确解析，毕竟 workspace 的结构
是在根目录声明的。

**怎么解决的：** 删掉了多余的 `apps/client` 服务。对于 `apps/server` 这个服务，去 Settings → Root
Directory 检查了一下，这次倒是没问题，构建日志显示 `tsx src/main.ts` 成功启动，并打印出了
`✅ Server started: web http://0.0.0.0:8080, WebSocket ws://0.0.0.0:8080`，说明 workspace 依赖
确实解析对了。如果你的 Root Directory 被限定在某个子目录，结果构建失败在解析 workspace 依赖那一步，
把这个字段清空恢复成默认（仓库根目录）就行，这样 `railway.json` 里的命令才会从根目录执行。

## 7. 问题四：复制错了域名（内网地址 vs 公网地址）

**发生了什么：** Railway 的 Networking 设置里最先看到的是 `pm2server.railway.internal`，于是把它
当成了"这就是域名"。

这是错的，因为 `.railway.internal` 这种地址是内网地址，只能用于 Railway 自己基础设施内部的服务间
通信，比如一个 Railway 服务访问另一个服务（举个例子，访问一个数据库）。公网上的浏览器永远没办法访问
`.railway.internal` 这种地址。

**怎么解决的：** 在同一个 Networking 设置页面里，Public Networking 那部分（和 Private Networking
是分开的）有自己单独的 "Generate Domain" 按钮，点一下就会生成一个真正的公网地址，
`pm2server-production.up.railway.app`，任何浏览器都能访问。这个才是应该填进前端配置里的地址。

## 8. 问题五：Vercel 的环境变量页面长得和预期不一样

**发生了什么：** Vercel 的设置侧边栏里没有一个明显写着"Environment Variables"的入口，这个功能现在
被放进了一个叫"Environments"的新功能里，整个结构都被重新组织过了。

**怎么解决的：** 用 Vercel 的命令面板（`Cmd+K` / `Ctrl+K`），直接搜索"Environment Variables"，不管
侧边栏的结构怎么变，都能直接跳到正确的页面。这个技巧值得记住：碰到任何被重新设计过的后台界面，写好的
操作步骤可能已经过时了，这时候直接搜索往往比照着旧说明一层层点更快。

## 9. 问题六：环境变量其实根本没保存上

**发生了什么：** 那个页面上写着"No Environment Variables Added"（还没有添加任何环境变量）。尽管
之前已经说过要添加 `VITE_WS_URL`，但它其实从来没有真正保存进去。

这导致了和最开始完全一样的现象，但原因不一样了。没有设置这个环境变量，前端就会退回默认的同域 `/ws`
行为，也就是会去连 `wss://www.portmasters2.guru/ws`，而这个地址背后（参见第 2 节）根本没有服务器。

**怎么解决的：** 这次真正把变量加上了，并且专门作用域到了 Production 环境，也就是绑定 `main` 分支、
对应真实域名的那个环境。

## 10. 问题七：重新部署的不是该部署的那个环境

**发生了什么：** 加上环境变量之后触发了一次重新部署，但部署的是绑定在 `fix/vercel-railway-split`
分支上的一个 Preview 部署，而不是绑定 `main` 分支的 Production 部署。Preview 部署有自己单独的临时
网址，对真实域名上访问者看到的内容没有任何影响。

**怎么解决的：** 在 Deployments 列表里专门找到标着 Production（分支是 `main`）的那一条，重新部署
的是这一条。

## 11. 问题八：环境变量的值本身就填错了

**发生了什么：** 就算重新部署对了环境，登录还是失败，而且浏览器 Network 面板里完全看不到任何
WebSocket 连接的尝试，连一次失败的记录都没有。

**怎么不靠继续猜测后台界面来排查的：** 没有继续让用户去翻浏览器 DevTools 截图，而是直接在命令行里
检查线上网站实际跑的代码：

```bash
curl -s https://www.portmasters2.guru/ | head           # 找到 JS 文件名
curl -s https://www.portmasters2.guru/assets/index-XXXX.js -o bundle.js
grep -o '.\{0,40\}railway\.app.\{0,40\}' bundle.js       # 看看实际打包进去的是什么
```

结果发现了真正部署上线的代码是这样的：

```js
function wsUrl(){return `pm2server-production.up.railway.app`}
```

问题就在这儿：Vercel 上那个变量填的是一个裸域名（`pm2server-production.up.railway.app`），而不是
一个完整的 WebSocket 地址。一个没有 `wss://` 协议头、也没有 `/ws` 路径的裸域名，根本不是一个合法的
WebSocket 地址，所以 `new WebSocket(...)` 在构造的时候就直接抛错了，连尝试建立网络连接这一步都没走到。
这就是为什么 Network 面板里连一条 WS 记录都看不到：连接根本没被尝试，构造阶段就失败了。

**怎么解决的：** 把这个值改成了完整地址：

```
wss://pm2server-production.up.railway.app/ws
```

（必须带 `wss://` 协议头，必须带 `/ws` 路径，这个路径要和
[createHttpServer.ts](apps/server/src/http/createHttpServer.ts) 里监听的路径对上。）

还有一个值得记住的小技巧：不用浏览器，直接用 `curl` 就能测试服务器的 WebSocket 接口是否正常：

```bash
curl -sv --http1.1 --max-time 10 \
  -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Origin: https://www.portmasters2.guru" \
  https://<你的 Railway 域名>/ws
```

如果服务器工作正常，会返回 `HTTP/1.1 101 Switching Protocols`。在真正发现那个环境变量的问题之前，
这个测试就已经确认了 Railway 那边本身是好的，相当于提前排除了"服务器到底能不能访问到"这个问题。

有一点要注意：如果这个请求走的是 HTTP/2（只要服务器的 TLS 支持，curl 默认就会用 HTTP/2），会得到一个
容易误导人的 `404`，因为 `Upgrade` 这个请求头在 HTTP/2 下的含义不一样了。用这种方式测试 WebSocket
握手时，一定要加上 `--http1.1` 强制使用 HTTP/1.1。

## 12. 目前的状态，以及还值得再确认一遍的地方

- 已完成：代码已经合并进 `main`（PR #6，commit `73f39d9`）。
- 已完成：确认了 Railway 上的服务器是在线的，能正确响应 WebSocket 握手。
- 已完成：Vercel Production 上的 `VITE_WS_URL` 已经改成完整的 `wss://.../ws` 格式，并且已经重新
  部署过。
- 还没确认：Railway 上是否真的挂载了持久化磁盘（Volume，挂载路径 `/data`），并且 `USERS_FILE_PATH`
  是否对应设置成了 `/data/users.json`。如果没有，每次 Railway 重新部署都会把注册过的账号清空，因为
  容器自带的磁盘本来就是临时的。这件事最好在真正有用户注册之前确认清楚。
- 还没确认：Railway 上是否设置了 `ALLOWED_ORIGINS`（比如
  `https://www.portmasters2.guru,https://portmasters2.guru`）。没设置的话，服务器目前会接受任何
  来源发起的 WebSocket 连接，功能上没问题，只是没有锁起来。
- 待清理：如果还没删的话，Railway 上自动生成的那个多余的 `apps/client` 服务应该删掉，它没有任何用处，
  只会白白消耗 Railway 的用量和构建时间。

## 13. 留给以后的简单判断标准

- **Vercel** 很适合静态网站和短时间的请求/响应式接口，不适合需要一直保持连接，或者要在多次请求之间
  保留内存状态的场景。
- **Railway**（或者类似的 Render、Fly.io）跑的是真正持续运行的进程，适合 WebSocket 服务器、后台
  worker，或者任何有状态的东西。
- 当前端和后端不在同一个域名下时，前端需要被明确告知服务器的地址（这里是 `VITE_WS_URL`），同域名的
  假设会在不知不觉中失效。
- Vite 的环境变量是在构建时就打包进代码里的，不是运行时读取的。改了变量之后，必须重新构建部署才会
  生效。
- `.railway.internal` 是内网地址，只能用于服务之间互相访问；`*.up.railway.app`（或者自定义域名）
  才是公网地址，浏览器能访问到。
- 想确认线上部署的代码到底在干什么的时候，直接 `curl` 线上网站，再到打包出来的 JS 文件里搜一下，
  比来回看浏览器 DevTools 的截图更快，也更准。
