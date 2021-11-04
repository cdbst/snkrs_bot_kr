const gen_sensor_data = require("../ipc_main_sensor.js").gen_sensor_data;

class TaskRunner{
    constructor(browser_context, task_info, product_info, status_channel){

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);

        this.open_product_page = this.open_product_page.bind(this);
        this.judge_appropreate_size= this.judge_appropreate_size.bind(this);
        this.send_sensor_data = this.send_sensor_data.bind(this);
        this.click_apply_draw_button = this.click_apply_draw_button.bind(this);
        this.judge_appropreate_size_info = this.judge_appropreate_size_info.bind(this);

        this.browser_context = browser_context;
        this.task_info = task_info;
        this.product_info = product_info;
        this.status_channel = status_channel;

        this.__stop = false;
        this.retry_cnt = task_info.retry_cnt == undefined ? 100 : task_info.retry_cnt;

        this.csrfToken = undefined;
    }

    judge_appropreate_size_info(){

        let size_info_len = this.product_info.size_info_list.length;

        if(size_info_len == 0){
            return undefined;
        }

        let size_info_list_has_quantity = this.product_info.size_info_list.filter((size_info) => { return size_info.quantity > 0} );

        if(size_info_list_has_quantity.length == 0){ // 재고가 하나도 없는 상태임.
            return undefined;
        }

        let target_size_name = this.task_info.size_name;
        
        var i = 0;
        var j = 0;

        let target_size_info = undefined;
        let found_target_size_info = false;
        
        // TODO 알고리즘 최적화 필요...
        while(target_size_info == undefined){
            
            if(found_target_size_info == false){

                let size_info = this.product_info.size_info_list[i];

                if(size_info.name == target_size_name){

                    found_target_size_info = true;

                    if(size_info.quantity != 0){
                        target_size_info = size_info;
                        break;
                    }
                }

                i++;

            }else{

                j++;

                let upper_size_idx = Math.min((i + j), size_info_len - 1);
                let lower_size_idx = Math.max((i - j), 0);

                let upper_size_info = this.product_info.size_info_list[upper_size_idx];
                if(upper_size_info.quantity != 0){
                    target_size_info = upper_size_idx;
                    break;
                }else if(lower_size_idx.quantity != 0){
                    target_size_info = lower_size_idx;
                    break;
                }
            }

            if(i == size_info_len - 1){ // not found yet.. random select..
                let max = size_info_list_has_quantity.length - 1;
                let random_idx = Math.random() * (max - 0) + 0;

                target_size_info = size_info_list_has_quantity[random_idx];
                break;
            }

            if(j == size_info_len - 1){ // cannot found anymore..
                break;
            }
        }
    }

    send_sensor_data(__callback){

        gen_sensor_data((error, sensor_data)=>{

            if(error){
                console.warn('cannot generate sensor data.');
            }

            this.browser_context.send_sensor_data(sensor_data, (error) =>{
                if(error){
                    console.warn('fail with send sensor data.');
                }
                __callback();
            });
        });
    }

    start(__callback){

        this.__stop = false;
        this.open_product_page(__callback);
    }

    click_apply_draw_button(size_info, retry, __callback){

        if(size_info == undefined){
            size_info = this.judge_appropreate_size_info();
        }

        if(size_info == undefined){
            __callback('cannot found size information.');
            return;
        }

        this.send_sensor_data(()=>{

            //apply_draw(product_info, draw_id, sku_id, draw_product_xref, draw_sku_xref, csrfToken, __callback)
            this.browser_context.apply_draw(this.product_info, size_info, this.csrfToken, retry, (err, retry)=>{

                if(err){
                    console.error(err);

                    if(retry <= 0){
                        __callback('cannot apply THE DRAW.');
                    }else{
                        this.click_apply_draw_button(size_info, --retry, __callback);
                    }
                    return;
                }

                //TODO SEND SUCCESS DATA TO Renderer process.
                __callback(undefined);
            });
        });
    }

    open_product_page(__callback){

        this.__stop = false;

        const open_page_cb = (err, retry, csrfToken, $) => {

            if(err){
                if(retry <= 0){
                    __callback('cannot access to product page');
                }else{
                    this.browser_context.open_page(this.product_info.product_url, --retry, open_page_cb);
                }
                return;
            }

            if(csrfToken == undefined){
                if(retry <= 0){
                    __callback('cannot found access token from product page');
                }else{
                    this.browser_context.open_page(this.product_info.product_url, --retry, open_page_cb);
                }
                return;
            }

            this.csrfToken = csrfToken;

            if(this.product_info.sell_type == common.SELL_TYPE.draw){
                this.click_apply_draw_button(undefined, this.retry_cnt, __callback);
            }else{
                //
            }
            
        }

        this.browser_context.open_page(this.product_info.product_url, this.retry_cnt, open_page_cb);
    }


    stop(){
        this.__stop = true;
    }
}