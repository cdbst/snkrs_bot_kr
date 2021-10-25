const {ipcMain} = require("electron");
const BrowserCxt = require("./api/browser_context.js");
const UserBrowserCxtMngr = require("./api/browser_context_mngr.js").userUserBrowserCxtMngr;
const UserFileManager = require("./api/user_file_mngr.js").UserFileManager;
const USER_FILE_PATH = require('./user_file_path.js').USER_FILE_PATH;

const common = require('./common/common.js');
const product_page_parser = require('./api/product_page_parser.js');

const IpcMainSensor = require('./ipc_main_sensor');

function register(){

    ipcMain.on('get-product-info-list', (event, data) => {

        let browser_cxt = new BrowserCxt.BrowserContext();

        browser_cxt.open_feed_page((_err, product_list_info)=>{
            event.reply('get-product-info-list-reply' + data.id, {err : _err, data : product_list_info});
        });
    });

    ipcMain.on('get-product-info', (event, data) => {

        let browser_cxt = new BrowserCxt.BrowserContext();
        let product_url = data.payload.product_url;

        browser_cxt.open_product_page(product_url, (_err, product_info) =>{

            if(product_info.sell_type == common.SELL_TYPE.normal){

                browser_cxt.get_product_sku_inventory(product_url, product_info.product_id, (_err, sku_inventory_info) => {

                    if(_err){
                        event.reply('get-product-info-reply' + data.id, {err : _err, data : undefined});
                        return;
                    }

                    product_page_parser.update_product_info_as_sku_inventory_info(product_info, sku_inventory_info);
                    event.reply('get-product-info-reply' + data.id, {err : _err, data : product_info});
                });
                
            }else{
                event.reply('get-product-info-reply' + data.id, {err : _err, data : product_info});
            }
        });
    });

}


module.exports.register = register;