
class ContentsAccounts extends React.Component {

    constructor(props) {
        super(props);

        this.addAccount = this.addAccount.bind(this);
        this.addBulkAccount = this.addBulkAccount.bind(this);
        this.removeAccount = this.removeAccount.bind(this);
        this.getAccountInfoList = this.getAccountInfoList.bind(this);
        this.onClickLoginAll = this.onClickLoginAll.bind(this);
        this.showAccountEditModal = this.showAccountEditModal.bind(this);
        this.showAccountBulkEditModal = this.showAccountBulkEditModal.bind(this);
        this.__loadAccountInfoFile = this.__loadAccountInfoFile.bind(this);
        this.__setupColumnsWidth = this.__setupColumnsWidth.bind(this);
        this.onClickCleanupCartAll = this.onClickCleanupCartAll.bind(this);
        this.pushAccountTableItem = this.pushAccountTableItem.bind(this);
        this.checkDuplicatedItem = this.checkDuplicatedItem.bind(this);
        
        this.account_edit_modal_el_id = "edit-account-modal";
        this.account_bulk_edit_modal_el_id = "bulk-edit-account-modal";

        this.state = {
            account_table_list : []
        }
        
        this.__setupColumnsWidth();
    }

    __setupColumnsWidth(){
        this.actions_col_width = 280;
        this.status_col_width = 120;
        this.email_col_width = 'calc( 100% - ' + (this.actions_col_width + this.status_col_width) + 'px)';
    }

    componentDidMount(){
        this.__loadAccountInfoFile();
    }

    __loadAccountInfoFile(){

        window.electron.getAccountInfo( (err, data) => {

            if(err) {
                Index.g_sys_msg_q.enqueue('경고', '계정정보가 아직 없거나 읽을 수 없습니다.', ToastMessageQueue.TOAST_MSG_TYPE.WARN, 5000);
            }else{

                data.accounts.forEach((account_info) =>{                    
                    this.pushAccountTableItem(account_info, false);
                });
            }
        });
    }

    getAccountInfoList(){
        return this.state.account_table_list.map((table_item) => table_item.props.account_info);
    }

    addBulkAccount(_account_info_list){
        //_account_info_list 는 멀티라인 텍스트이다.

        const account_info_list = _account_info_list.split('\n');
        const error_messages = [];
        const account_info_obj_list = [];

        for(var i = 0; i < account_info_list.length; i++){
            const account_info = account_info_list[i];

            if(account_info.trim() === '') continue; // 공백라인은 생략한다.

            const email_pwd_info_array = account_info.split(':');
            if(email_pwd_info_array.length < 2){
                error_messages.push(`[${i + 1}]번째 줄의 입력값이 올바르지 않습니다. (${account_info})`);
                continue;
            }

            const email = email_pwd_info_array.shift().trim();
            const pwd = email_pwd_info_array.join(':');

            //유효성 검사 : email이 올바른 포멧인지 확인 필요.
            if(common.is_valid_email(email) == null){
                error_messages.push(`[${i + 1}]번째 줄의 이메일 값이 올바르지 않습니다. (${account_info})`);
                continue;
            }
            if(pwd === ''){
                error_messages.push(`[${i + 1}]번째 줄의 비밀번호 값이 빈상태 입니다. (${account_info})`);
                continue;
            }

            // 중복 점검 - 현재 새로 계정 들 중에서도 중복인지 확인.
            let duplicated_account_info = account_info_obj_list.find((account_info_obj) => account_info_obj.email === email);
            if(duplicated_account_info !== undefined){
                error_messages.push(`[${i + 1}]번째 줄의 계정 정보는 이미 앞에서 입력됐습니다. (${account_info})`);
                continue;
            }

            // 중복 점검 - 기존 리스트.        
            if(this.checkDuplicatedItem(email)){
                error_messages.push(`[${i + 1}]번째 줄의 계정 정보는 이미 등록된 계정입니다. (${account_info})`);
                continue;
            }

            const account_info_obj = common.get_account_info_obj_scheme();
            common.update_account_info_obj(account_info_obj, 'email', email);
            common.update_account_info_obj(account_info_obj, 'pwd', pwd);
            common.update_account_info_obj(account_info_obj, 'id', common.uuidv4());
            common.update_account_info_obj(account_info_obj, 'locked', false);

            account_info_obj_list.push(account_info_obj);            
        }
        
        if(error_messages.length > 0){
            Index.g_prompt_modal.popModal('에러 정보', CommonUtils.getTextListTag(error_messages), ()=>{this.showAccountBulkEditModal()});
            return;
        }
        
        if(account_info_obj_list.length === 0) return;

        window.electron.addAccountList(account_info_obj_list, (err)=>{

            if(err){
                Index.g_sys_msg_q.enqueue('에러', '새로운 계정들을 등록하는데 실패했습니다. ' + _email, ToastMessageQueue.TOAST_MSG_TYPE.ERR, 5000);
                return;
            }

            account_info_obj_list.forEach((account_info) =>{
                this.pushAccountTableItem(account_info, false);
            });
            
            Index.g_sys_msg_q.enqueue('알림', `총 ${account_info_obj_list.length} 개의 계정을 등록했습니다.`, ToastMessageQueue.TOAST_MSG_TYPE.INFO, 5000);
        });
    }

    addAccount(account_info){

        if(account_info.pwd == ''){
            Index.g_sys_msg_q.enqueue('에러', '유효한 비밀번호를 입력하세요.', ToastMessageQueue.TOAST_MSG_TYPE.ERR, 5000);
            return;
        }

        if(common.is_valid_email(account_info.email) == null){
            Index.g_sys_msg_q.enqueue('에러', '유효한 이메일 주소를 입력하지 않았습니다.', ToastMessageQueue.TOAST_MSG_TYPE.ERR, 5000);
            return;
        }

        if(this.checkDuplicatedItem(account_info.email)){
            Index.g_sys_msg_q.enqueue('에러', account_info.email + ' 해당 계정이 이미 등록된 상태입니다.', ToastMessageQueue.TOAST_MSG_TYPE.ERR, 5000);
            return;
        }
        
        this.pushAccountTableItem(account_info, true);
    }

    removeAccount(account_id){
        
        const new_account_table_list = this.state.account_table_list.filter((table_item) => table_item.props.account_info.id !== account_id);

        if(new_account_table_list.length === this.state.account_table_list.length){
            Index.g_sys_msg_q.enqueue('에러', '제거할 계정 정보를 찾을 수 없습니다.', ToastMessageQueue.TOAST_MSG_TYPE.ERR, 5000);
            return;
        }

        this.setState({
            account_table_list : new_account_table_list
        });
    }

    showAccountEditModal(_email, _pwd){

        let el_pwd_inpt = document.getElementById(this.EL_ID_MODAL_INPUT_PWD);
        let el_email_input = document.getElementById(this.EL_ID_MODAL_INPUT_EMAIL);

        //Idd Item Needed;
        el_email_input.value = _email;
        el_pwd_inpt.value = _pwd

        let el_modal = document.getElementById(this.account_edit_modal_el_id);
        var bs_obj_modal = bootstrap.Modal.getInstance(el_modal);
        bs_obj_modal.show();
    }

    showAccountBulkEditModal(){
        const el_modal = document.getElementById(this.account_bulk_edit_modal_el_id);
        var bs_obj_modal = bootstrap.Modal.getInstance(el_modal);
        bs_obj_modal.show();
    }

    onClickLoginAll(e){

        this.state.account_table_list.forEach((table_item) =>{
            table_item.ref.current.doLogin(false);
        });
    }

    onClickCleanupCartAll(){

        this.state.account_table_list.forEach((table_item) =>{
            table_item.ref.current.cleanupCart(false);
        });
    }

    pushAccountTableItem(account_info, save_to_file){

        const account_table_list = this.state.account_table_list;
        
        account_table_list.push(
            <AccountsTableItem 
                ref={React.createRef()}
                key={account_info.id} 
                account_info={account_info}
                h_remove={this.removeAccount.bind(this, account_info.id)}
                e_mail_col_width={this.email_col_width}
                status_col_width={this.status_col_width}
                actions_col_width={this.actions_col_width}
                save_to_file={save_to_file}
            />
        );

        this.setState({
            account_table_list : account_table_list
        });
    }

    checkDuplicatedItem(email){

        const duplicated_table_item = this.state.account_table_list.filter((table_item)=>{
            if(table_item.props.account_info.email === email) return true;
            else return false;
        });

        return duplicated_table_item.length > 0;
    }

    render() {
        return (
            <div className="tab-pane fade" id="accounts" role="tabpanel" aria-labelledby={MenuBar.MENU_ID.ACCOUNTS}>
                <div className="container-fluid">
                    <AccountEditModal id={this.account_edit_modal_el_id} h_add_new_account={this.addAccount.bind(this)}/>
                    <TextareaEditModal 
                        id={this.account_bulk_edit_modal_el_id} 
                        h_submit={this.addBulkAccount.bind(this)}
                        title="계정 여러개 추가하기"
                        desc="한 줄당 계정 하나 👉 testaccount@gmail.com:testpassword"
                    />
                    <br/>
                    <div className="row">
                        <div className="col">
                            <h4 className="contents-title">{`계정관리 (${this.state.account_table_list.length})`}</h4>
                        </div>
                        <div className="col">
                            {/* <a>TEST : search item interface</a> */}
                        </div>
                    </div>
                    <div className="table-wrapper">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th scope="col" style={{width : this.email_col_width, maxWidth : this.email_col_width}}>이메일</th>
                                <th scope="col" style={{width : this.status_col_width, maxWidth : this.status_col_width}}>상태</th>
                                <th scope="col" style={{width : this.actions_col_width, maxWidth : this.actions_col_width}}>동작</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.account_table_list}
                        </tbody>
                    </table>
                    </div>
                    <div className="row footer">
                        <div className="d-flex flex-row-reverse bd-highlight align-items-center">
                            <button type="button" className="btn btn-primary btn-footer-inside" data-bs-toggle="modal" data-bs-target={'#' + this.account_edit_modal_el_id}>
                                <img src="./res/img/file-plus-fill.svg" style={{width:24, height:24}}/> 추가하기
                            </button>
                            <button type="button" className="btn btn-primary btn-footer-inside" data-bs-toggle="modal" data-bs-target={'#' + this.account_bulk_edit_modal_el_id}>
                                <img src="./res/img/lightning-fill.svg" style={{width:24, height:24}}/> 여러개 추가
                            </button>
                            <button type="button" className="btn btn-info btn-footer-inside" onClick={this.onClickLoginAll.bind(this)}>
                                <img src="./res/img/door-open-fill.svg" style={{width:24, height:24}}/> 전체로그인
                            </button>
                            <button type="button" className="btn btn-warning btn-footer-inside" onClick={this.onClickCleanupCartAll.bind(this)}>
                                <img src="./res/img/cart-x-fill.svg" style={{width:24, height:24}}/> 전체카트비우기
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}