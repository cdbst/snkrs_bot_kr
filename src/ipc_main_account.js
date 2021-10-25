const {ipcMain} = require("electron");
const BrowserCxt = require("./api/browser_context.js");
const UserBrowserCxtMngr = require("./api/browser_context_mngr.js").userUserBrowserCxtMngr;
const UserFileManager = require("./api/user_file_mngr.js").UserFileManager;
const USER_FILE_PATH = require('./user_file_path.js').USER_FILE_PATH;

const IpcMainSensor = require('./ipc_main_sensor');

function register(){

    ipcMain.on('get-logged-in-account-info-list', (event, data) => {

        try{
            let logged_in_browser_contexts = UserBrowserCxtMngr.get_all_logged_in_browser_contexts();
            let logged_in_account_info_list = logged_in_browser_contexts.map((browser_context) => browser_context.get_account_info());
            event.reply('get-logged-in-account-info-list-reply' + data.id, {err : undefined, data : logged_in_account_info_list}); 
        }catch(e){
            event.reply('get-logged-in-account-info-list-reply' + data.id, {err : e, data : undefined});
        }
    });

    ipcMain.on('add-account', (event, data) => {

        let account_info = data.payload;
        let ipc_id = data.id;
        
        let borwser_context = new BrowserCxt.BrowserContext(account_info.email, account_info.pwd, account_info.id);

        borwser_context.open_main_page((err) =>{

            if(err == undefined){ // 새로운 유저를 추가하는 것이므로 여기서는 파일을 업데이트 한다.

                UserBrowserCxtMngr.add(borwser_context);

                write_user_info_file(UserBrowserCxtMngr, (err) =>{
                    event.reply('add-account-reply' + ipc_id, err);
                });

            }else{
                event.reply('add-account-reply' + ipc_id, err);
            }
        });
    });

    ipcMain.on('remove-account', (event, data) => {

        let _id = data.payload.id;
        let result = UserBrowserCxtMngr.remove(_id);

        if(result == false){
            event.reply('remove-account-reply', 'caanot found browser context.');
        }else{
            write_user_info_file(UserBrowserCxtMngr, (err) =>{
                event.reply('remove-account-reply' + data.id, err);
            });
        }
    });

    ipcMain.on('get-account-info', (event, data) => {

        read_user_info_file((_err, _data) =>{
            event.reply('get-account-info-reply' + data.id, {err : _err, data : _data});
        });
    });

    ipcMain.on('login', (event, data) => {
        
        let _id = data.payload.id;
        let borwser_context = UserBrowserCxtMngr.get(_id);

        if(borwser_context == undefined){
            event.reply('login-reply' + data.id, 'cannot found browser context.');
            return;
        }

        let do_login = function(){

            borwser_context.login((err) =>{
                event.reply('login-reply' + data.id, err);
            });
        }

        if(borwser_context.is_login){

            borwser_context.open_main_page((err) =>{ // for page refreesh.

                if(err){
                    event.reply('login-reply' + data.id, 'caanot open nike.com main page.');
                    return;
                }

                do_login();
            });

        }else{
            do_login();
        }
    });
}

function write_user_info_file(_browser_context_mngr, __callback){

    let file_data = _browser_context_mngr.get_file_data();
    let ufm = new UserFileManager();

    ufm.write(USER_FILE_PATH.USER_INFO, file_data, (err) =>{
        __callback(err);
    });
}

function read_user_info_file(__callback){

    let ufm = new UserFileManager();

    ufm.read(USER_FILE_PATH.USER_INFO, (err, data) =>{
        __callback(err, data);
    });
}

module.exports.register = register;