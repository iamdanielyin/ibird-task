/**
 * 模块依赖
 */

const utility = require('ibird-utils');
const CronJob = require('cron').CronJob;
const namespace = 'ibird-task';
const api = { tasks: {} };
const context = {};
const configs = {}, runnings = {};

/**
 * 加载插件
 * @param app
 * @param options
 */
function onload(app, options) {
    context.app = app;
    context.options = options;
    if (options && typeof options.dir === 'string') {
        api.mountTasksDir(options.dir);
    }
}

/**
 * 新增任务
 * @param {Object} opts - 任务对象
 * @param {string} opts.name - 任务名称
 * @param {string} opts.cronTime - 触发时间（'cron'语法或'Date'对象的形式）
 * cron格式：[*] * * * * *
 *      Seconds: 0-59
 *      Minutes: 0-59
 *      Hours: 0-23
 *      Day of Month: 1-31
 *      Months: 0-11
 *      Day of Week: 0-6
 * @param {function} opts.onTick - 触发时的执行函数
 * @param {function} [opts.onComplete] - 任务完成时的执行函数（即当任务被'stop()'的时候触发）
 * @param {boolean} [opts.start] - 是否立即启动（默认true，表示任务对象不需要手动执行'job.start()'来启动）
 * @param {boolean} [opts.oneOff] - 是否为一次性任务（默认false，表示任务对象仅会被执行一次，当执行成功后就会被自动清理）
 * @param {string} [opts.timeZone] - 指定运行时区（详见http://momentjs.com/timezone/）
 * @param {string} [opts.context] - 任务运行函数的上下文对象（对应函数内部的'this'，指定后函数内部不能再通过'this'调用'stop()'）
 * @param {string} [opts.runOnInit] - 是否立即触发一次执行（默认为false）
 * @param {string} [opts.runMode] - 任务运行模式，可选值为：S（串行模式）或P（并行模式）；默认为S，即需要等待上一次任务完成后才会触发下一次执行
 */
api.addTask = function (opts) {
    if (!opts || !opts.name) return;
    if (!opts.onTick || typeof opts.onTick !== 'function') return;
    const app = context.app;
    if (typeof opts.runOnInit === 'number') {
        const delay = opts.runOnInit;
        opts.runOnInit = true;
        setTimeout(() => { api.addTask(opts) }, delay);
        return;
    }
    if (api.tasks[opts.name]) {
        api.delTask(opts.name);
    }
    if (typeof opts.start !== 'boolean') {
        opts.start = true;
    }
    opts.oneOff = !!opts.oneOff;
    opts.runMode = opts.runMode || 'serial';
    opts.runMode = opts.runMode.toLowerCase();
    opts.runMode = ['serial', 'parallel', 's', 'p'].indexOf(opts.runMode) >= 0 ? opts.runMode : 'serial';
    const onTick = opts.onTick;
    opts.onTick = async () => {
        if (['serial', 's'].indexOf(opts.runMode) >= 0 && runnings[opts.name]) return;
        app.info(`task '${opts.name}' is up.`);
        try {
            runnings[opts.name] = true;
            await onTick.call(this);
        } finally {
            delete runnings[opts.name];
        }
        app.info(`task '${opts.name}' is completed.\n`);

        // 清理一次性任务
        if (opts.oneOff && api.getTask(opts.name)) {
            api.delTask(opts.name);
        }
    }
    api.tasks[opts.name] = new CronJob(opts);
    configs[opts.name] = opts;
    return api.tasks[opts.name];
}

/**
 * 删除任务
 * @param {string} name - 任务名称
 */
api.delTask = function (name) {
    if (!name || !api.tasks[name]) return false;
    try {
        api.tasks[name].stop();
    } catch (error) { }
    delete api.tasks[name];
    delete configs[name];
    return true;
}

/**
 * 更新任务
 * @param {string} name - 原任务名称
 * @param {Object} opts - 任务对象
 */
api.updateTask = function (name, opts) {
    if (!name || !api.tasks[name] || !configs[name] || typeof opts !== 'object') return null;
    const config = Object.assign({}, configs[name]);
    api.delTask(name);

    Object.assign(config, opts);
    opts.name = opts.name || name;
    return api.addTask(config);
}

/**
 * 获取任务
 * @param {string} name - 任务名称
 */
api.getTask = function (name) {
    return name ? api.tasks[name] : api.tasks;
}

/**
 * 批量挂载任务目录
 * @param {string} dir - 任务目录
 */
api.mountTasksDir = function (dir) {
    utility.recursiveDir(dir, api.addTask);
}

/**
 * 任务列表路由
 * @param {Object} ctx 
 */
function tasksRoute(ctx) {
    ctx.body = { data: api.getTask(ctx.query.name) };
}

/**
 * 导出模块
 */
module.exports = {
    namespace,
    onload,
    api,
    routes: {
        'tasks': {
            name: 'tasks',
            method: 'GET',
            path: '/tasks',
            middleware: tasksRoute
        }
    }
};