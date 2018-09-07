# ibird-task

任务插件

## 安装

```sh
npm install ibird-task
```

## 引用

```js
const app = require('ibird').newApp();
const taskAddon = require('ibird-task');

app.import(taskAddon);
```

## 插件信息

- **命名空间** - ibird-task
- **引用参数**
  - `dir` - 可选，字符串类型，任务文件所在目录，指定后，该目录下所有文件都会被自动挂载
- **API**
  - `addTask(obj)` - 新增任务（对象参数见**任务格式**）
  - `delTask(name)` - 删除任务
  - `updateTask(name, opts)` - 更新任务
  - `getTask(name)` - 查询新增成功任务
  - `mountTasksDir(dir)` - 批量挂载任务目录
- **路由**
  - `GET /tasks` - 返回已注册成功的任务列表

### 任务格式

- **name** - 任务名称，必填
- **cronTime** - 触发时间（'cron'语法或'Date'对象的形式），必填
- **onTick** - 触发时的执行函数（支持Promise），必填
- **oneOff** - 是否为一次性任务，默认false
- **runOnInit** - 注册后立即触发，支持设置延迟毫秒，boolean/number
- **runMode** - 任务运行模式，可选值为：S（串行模式）或P（并行模式）；默认为S，即需要等待上一次任务完成后才会触发下一次执行

### Cron格式

`[*] * * * * *`

- Seconds: 0-59
- Minutes: 0-59
- Hours: 0-23
- Day of Month: 1-31
- Months: 0-11 (Jan-Dec)
- Day of Week: 0-6 (Sun-Sat)