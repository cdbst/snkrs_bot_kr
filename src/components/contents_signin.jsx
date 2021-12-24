class ContentsSignIn extends React.Component {

    INPUT_EMAIL_ID = 'input-signin-emial';
    INPUT_PWD_ID = 'input-signin-password';
    SIGNIN_BTN_ID = 'btn-signin';
    INPUT_REMEMBER_INFO_ID = 'input-remember-info';

    constructor(props) {
        super(props);

        this.onSubmitUserInfo = this.onSubmitUserInfo.bind(this);
        this.onKeyDownInputPwd = this.onKeyDownInputPwd.bind(this);
        this.__mount = false;
    }

    componentDidMount(){
        this.__mount = true;
        //TODO : 로그인 정보 파일을 읽을 수 있다면 input을 초기화 시킨다.
    }

    componentWillUnmount(){
        this.__mount = false;
    }

    onSubmitUserInfo(e){

        // TODO : 로그인시 남은 사용기간이 언제까지인지 표시 필요.
        e.preventDefault();

        const email = document.getElementById(this.INPUT_EMAIL_ID).value;

        if(email == undefined || email == ''){
            Index.g_sys_msg_q.enqueue('에러', '이메일을 입력하지 않았습니다.', ToastMessageQueue.TOAST_MSG_TYPE.ERR, 3000);
            return;
        }

        if(common.is_valid_email(email) == null){
            Index.g_sys_msg_q.enqueue('에러', '유효한 이메일 주소를 입력하지 않았습니다.', ToastMessageQueue.TOAST_MSG_TYPE.ERR, 3000);
            return;
        }

        const password = document.getElementById(this.INPUT_PWD_ID).value;

        if(password == undefined || password.value == ''){
            Index.g_sys_msg_q.enqueue('에러', '비밀번호를 입력하지 않았습니다.', ToastMessageQueue.TOAST_MSG_TYPE.ERR, 3000);
            return;
        }

        const remember = document.getElementById(this.INPUT_REMEMBER_INFO_ID).checked;
        console.log(`remember : ${remember}`);

        const el_btn_signin = document.getElementById(this.SIGNIN_BTN_ID);
        el_btn_signin.disabled = true;
        
        window.electron.loginApp(email, password, remember, (err, result)=>{

            el_btn_signin.disabled = false;

            if(err){
                Index.g_sys_msg_q.enqueue('에러', err, ToastMessageQueue.TOAST_MSG_TYPE.ERR, 5000);
            }else{
                Index.g_sys_msg_q.enqueue('알림', '로그인에 성공했습니다.', ToastMessageQueue.TOAST_MSG_TYPE.INFO, 5000);
            }
        });
    }

    onKeyDownInputPwd(e){
        if(e.keyCode == 13){
            this.onSubmitUserInfo(e);
        }
    }

    //TODO: 정보 저장 체크박스 관련 처리
    // 체크된 상태로 로그인에 성공하면 파일로 저장
    // 체크 해제시 로그인 정보 파일 삭제

    render() {
        return (
            <div className="text-center form-signin d-flex flex-column min-vh-100 justify-content-center align-items-center">
                <div className="col-md-12">
                    <h1 className="h3 mb-3 contents-title">SNKRS BOT KR</h1>
                    <br/>
                    <div className="form-floating">
                        <input type="email" className="form-control" id={this.INPUT_EMAIL_ID} style={{"--width" : "100%"}} placeholder="name@example.com" />
                        <label className="sigin-in-user-info-label" htmlFor={this.INPUT_EMAIL_ID}>이메일 주소</label>
                    </div>
                    <div className="form-floating">
                        <input type="password" className="form-control" id={this.INPUT_PWD_ID} style={{"--width" : "100%"}} placeholder="비밀번호" onKeyDown={this.onKeyDownInputPwd.bind(this)}/>
                        <label className="sigin-in-user-info-label" htmlFor={this.INPUT_PWD_ID}>비밀번호</label>
                    </div>
                    <br/>
                    <div className="form-switch mb-3">
                        <input id={this.INPUT_REMEMBER_INFO_ID} type="checkbox" className="form-check-input" style={{marginRight: '5px'}}/>
                        <label htmlFor={this.INPUT_REMEMBER_INFO_ID} className="form-check-label">로그인정보 저장하기</label>
                    </div>
                    <button className="w-100 btn btn-lg btn-primary" type="submit" id={this.SIGNIN_BTN_ID} onClick={this.onSubmitUserInfo.bind(this)}>로그인</button>
                    <p className="mt-5 mb-3 text-muted">&copy; cdbst 2021-2022</p>
                </div>
            </div>
        );
    }
}