const IpcMainAccount = require('./ipc_main_account');
const IpcMainSensor = require('./ipc_main_sensor');
const IpcMainProduct = require('./ipc_main_product');
const IpcMainTask = require('./ipc_main_task');
const IpcMainBilling = require('./ipc_main_billing');
const IpcMainProxy = require('./ipc_main_proxy');
const IpcMainSettings = require('./ipc_main_settings');
const IpcMainTheDraw = require('./ipc_main_thedraw');
const IpcMainCommon = require('./ipc_main_common');
const IpcMainAppAuth = require('./ipc_main_app_auth');

function register(win){
    // IPC Responses
    IpcMainAppAuth.register();
    IpcMainAccount.register();
    IpcMainProduct.register();
    IpcMainSensor.register(win);
    IpcMainTask.register();
    IpcMainBilling.register();
    IpcMainProxy.register();
    IpcMainSettings.register();
    IpcMainTheDraw.register();
    IpcMainCommon.register(win);
}

module.exports.register = register;
