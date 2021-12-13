const {ipcMain} = require("electron");
const USER_FILE_PATH = require('../user_file_path.js').USER_FILE_PATH;
const search_address = require('../api/address_search').search_address;
const UserFileManager = require("../api/user_file_mngr.js").UserFileManager;

const log = require('electron-log');
const common = require('../common/common');

function register(){

    ipcMain.on('search-address', (event, data) => {

        let ipc_id = data.id;

        search_address(data.payload.address, (err, search_result)=>{
            if(err) log.error(common.get_log_str('ipc_main_billing.js', 'search-address-callback', err));
            event.reply('search-address-reply' + ipc_id, {err : err, data : search_result});
        });
    });

    ipcMain.on('save-billing-info', (event, data) => {

        let ipc_id = data.id;
        let billing_info = data.payload.billing_info;
        
        UserFileManager.write(USER_FILE_PATH.BILLING_INFO, billing_info, (err) =>{
            if(err) log.error(common.get_log_str('ipc_main_billing.js', 'UserFileManager.write-callback', err));
            event.reply('save-billing-info-reply' + ipc_id, {err : err});
        });
    });

    ipcMain.on('load-billing-info', (event, data) => {

        let ipc_id = data.id;

        UserFileManager.read(USER_FILE_PATH.BILLING_INFO, (err, data) =>{
            if(err) log.error(common.get_log_str('ipc_main_billing.js', 'UserFileManager.read-callback', err));
            event.reply('load-billing-info-reply' + ipc_id, {err : err, data : data});
        });
    });
}


module.exports.register = register;