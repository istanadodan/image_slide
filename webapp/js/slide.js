const basedir = "static/";

function init() {
    Vue.component("slider-tab",{
        props:['isopen','img_src'],
        template:`<div v-show='isopen' id='slideImg'>
                    <div id="slider_button">
                        <button @click='sliding_start'>슬라이딩 재생</button>
                        <button @click='sliding_stop'>슬라이딩 중지</button>
                        <button @click='next'>다음이미지</button>
                        <button @click='pre'>이전이미지</button>
                    </div>
                    <img :src='img_src' height='600px' @click='onClose'/>
                   </div> 
                `,
        data:function() {
                return {
                    message:''
                };
        },
        methods:{
            next(){
                // this.sliding_stop();
                this.$emit('navi',1); //순방향 1, 역방향 -1
            },
            pre(){
                // this.sliding_stop();
                this.$emit('navi',-1); //순방향 1, 역방향 -1
            },
            onClose(){
                this.sliding_stop();
                this.$emit('close_viewer');
            },
            sliding_start(){
                this.message = "슬라이딩 개시"
                this.$emit("sliding", true);
                this.$emit("sendmsg",this.message);
            },
            sliding_stop(){
                this.message = "슬라이딩 중지"
                this.$emit("sliding", false);
                this.$emit("sendmsg",this.message);
            },
        }
    });

    const sliderTab ={
        template:"<div>tset slider</div>"
    }
    Vue.filter('formatNumber', function(value){
        if (!value) return '';

        const pattern = /(\d{3})(?=\d)/g
        s1 = String(value).split('').reverse().join('').replace(pattern, '$1,');
        return s1.split('').reverse().join('')
    });
    const app = new Vue(
        {
            el:"#app",
            components:{
                'slider-tab1':sliderTab
            },
            created:function(){
                this.v_func01_01_data = this.v_func01_01_data_list[0];
                this.filterOut(true);
                this.img_thumb_class['width'] = '180px';
            },
            filters:{
                'formatNumber2':function(value){
                    return value +'ss';
                }
            },
            watch:{
                auto:function() {
                    if(!this.auto) {
                        this.slide_index = 0;
                        clearInterval(this.timer);
                        this.timer = null;
                    }
                    console.log("timer:",this.timer)
                    console.log("auto:",this.auto)
                },
                isViewer:function(value){
                    console.log("viewer::",value)
                    if (value) {
                        this.img_thumb_class['width'] = '110px';
                    } else {
                        this.img_thumb_class['width'] = '180px';
                    }
                },
                cached: function(lst) {
                    this.file_count = lst.length
                }
            },
            data:{
                files:[],
                filter_opt:{memo:false,people:false,hq:false,etc:false},
                bookName:'Album 2019',
                albumName:'',
                albumList:[],
                isViewer:false,
                slide_img_src:'', //함수결과로 받은 경로값.
                edit_img_src:'', //클릭한 이미지객체
                auto:false,
                slide_index:0,
                sliding_direction:1,
                file_count:0,
                timer:null,
                is_func01:false,
                is_func02:false,
                selected_function:'rotate',
                v_func01_01_factors:[1.5,1.6,1.7,1.8,1.9,2.0],
                v_func01_01_data_list:['haarcascade_frontalface_default.xml'],
                v_func01_01_data:'',
                v_func01_01_factor:1.8,
                v_func02_01_rotate:90,
                v_func02_02_quality:100,
                result_message:'',
                img_thumb_class:{}
            },
            mounted: function() {
                this.getAlbums();
            },
            computed:{
                cached:function(){
                    // 메모가 있는 파일을 축출한다.
                    return this.files.filter(e=>{
                        return this.filter_opt.memo && e.memo ||
                               this.filter_opt.people && e.KO ||
                               this.filter_opt.hq && e.HQ ||
                               this.filter_opt.etc && (!e.memo&&!e.people&&!e.HQ);
                    });
                }
            },
            methods:{
                goHome:function(){
                    location.href="/";
                },
                selectBook:function(){
                    this.getAlbums();
                },
                getAlbums:function() {
                    const url="/album?book="+this.bookName;
                    axios.get(url).then((res)=>{
                        this.albumList = res.data;
                        this.albumName = this.albumList[0];
                        this.selectAlbum();
                    });
                },
                selectAlbum:function(){
                    // 슬라이딩 중지신청을 접수.
                    console.log("select album:", this.bookName,",", this.albumName)
                    this.auto = false;
                    this.files=[]
                    const url ='/album';
                    axios.post(url,{'book':this.bookName,'album':this.albumName}).then((res)=>{
                        console.log(res);
                        this.files=res.data;
                        this.file_count = this.files.length;
                    })
                },
                modify:function(){
                    data = {'book':this.bookName,
                            'album':this.albumName,
                            'data':this.edit_img_src};
                    url = "/album/update";
                    this.call_ajaxpost(url, data);
                },
                remove:function(){
                    yesno = confirm("삭제합니다")
                    if (!yesno) {
                        return;
                    }

                    data = {'book':this.bookName,
                            'album':this.albumName,
                            'data':this.edit_img_src
                            };
                    url = "/album/remove";

                    this.call_ajaxpost(url, data);
                },
                filterOut:function(target) {
                    if (!(target instanceof Array)) {
                        target = [target];
                    }
                    for( property in this.filter_opt ) {
                        // 발견되지않으면(목록에 없으면) 초기화
                        console.log("property",property);
                        isNotFound = true;
                        target.forEach(e=>{
                            if (property === e) {
                                isNotFound = false;
                                console.log("found",property);
                            }
                        });
                        if(isNotFound) {
                            this.filter_opt[property] = false
                        }
                    }
                },
                getPath:function(name){
                    return basedir +this.albumName +'/' +name;
                },

                calculate_index() {
                    this.slide_index += this.sliding_direction;
                    //인텍스가 유효범위를 넘어가면 초기화
                    this.check_index();
                    this.slide_img_src=this.getPath(this.cached[this.slide_index].filename);
                    console.log("인덱스계산 완료",this.slide_index)
                },
                check_index() {
                    if (this.slide_index >= this.file_count) {
                        this.slide_index = 0;
                    } else if (this.slide_index < 0) {
                        this.slide_index = this.file_count-1;
                    }
                },
                getviewer:function(file, index) {
                    this.slide_img_src = this.getPath(file.filename);
                },
                getedit:function(file){
                    this.edit_img_src = file;
                },
                control_auto_sliding(flag) {
                    console.log(this.auto,this.timer);
                    if (flag && !this.timer) {
                        this.timer = setInterval(()=>{
                            this.calculate_index();
                        }, 3000);
                    }
                    this.auto = flag
                },
                control_navi(direction){ //순방향 1, 역방향 -1
                    console.log("방향",direction)
                    this.sliding_direction = direction;
                    this.calculate_index();
                },
                // 얼굴인식기능
                exe_func01_01:function() {
                    const url ='/image/recognition';
                    data = {'book':this.bookName,
                            'album':this.albumName,
                            'data':this.cached,
                            'file':this.v_func01_01_data,
                            'scale_factor':this.v_func01_01_factor
                        }
                    this.call_ajaxpost(url, data);
                },
                // 이미지편집_회전기능
                exe_func02_01:function(){
                    const url ='/image/edit_f01';
                    data = {'book':this.bookName,
                            'album':this.albumName,
                            'data':this.cached,
                            'option':{'degree':this.v_func02_01_rotate},
                        }
                        this.call_ajaxpost(url, data);
                },
                // 이미지편집_품질변경
                exe_func02_02:function(){
                    const url ='/image/edit_f02';
                    data = {'book':this.bookName,
                            'album':this.albumName,
                            'data':this.cached,
                            'option':{'quality':this.v_func02_02_quality},
                        }
                    this.call_ajaxpost(url, data);
                },
                call_ajaxpost:function(url,data){
                    // this.files=[];
                    axios.post(url,data).then((res)=>{
                        console.log(res);
                        this.files=res.data;
                        this.file_count = this.files.length;
                    })
                },
                sendMessage:function(msg) {
                    this.result_message = msg;
                    setTimeout(()=>{
                        this.result_message='';
                    },3000);
                },
                filterOut2: function() {
                    id = arguments[0][0];
                    group = arguments[0][1];
                    // 클릭된 항목이 현재 선택된 상태일때
                    if ( this.filter_opt[id] )  {
                        return;
                    }
                    // 클릭된 항목이 현재 비선택된 상태일때
                    for(var k in this.filter_opt ) {
                        isFound = false;
                        let i=0;
                        for (i=0;i<group.length;i++){
                            if (k == group[i]){
                                isFound = true;
                                break;
                            };
                        }
                        if (!isFound) {
                            this.filter_opt[k] = false;
                        }
                    }
                },
                filterOut: function() {
                    if (arguments.length > 1) {
                        return this.filterOut2(arguments);
                    }
                    // true이면 전체선택, false면 전체해제
                    flag = arguments[0];
                    for(var k in this.filter_opt ) {
                        this.filter_opt[k] = flag;
                    }
                }
            }
        });
}
