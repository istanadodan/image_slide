
function init() {
    const stateService = {
        install:function(Vue, options) {
            
            Vue.prototype.$service = {
                // data structrue:
                // {
                // word,
                // meaning,
                // examples:[
                //     {value, controls={}},
                //      domain에는 value만 있고 controls는 화면제어용으로 추가 생성.
                // ],
                // keywords:[
                //     {value, controls={}},
                // ],
                // }
                data:[],
                org:[],
                dirty:[],
                deleted_item:[],
                //env
                //삭제 및 복원을 위해 조회시 대상dirty를 설정
                target:{},
                isEditedState:false,
                init:function(data) {
                    this.data=data;
                    //data 구조를 용도에 맞게 조정함.
                    this.preProcessing();
                    // 복제본을 만들어 org를 생성시킴
                    this._createBackup();
                    //작업환경초기화
                    this._env_reset();
                },
                _createBackup:function(){
                    this.org = JSON.parse(JSON.stringify(this.data));
                },
                preProcessing:function(){
                    // 1.article데이터에 isDisabeld를 추가한다.
                    // 2. dirty생성
                    this.data.forEach( (e, ix) => {
                        this.dirty[ix] ={};
                        for(const p in e) {
                            if( e[p] instanceof Array ) {
                                this.dirty[ix][p] = [];

                                e[p].forEach((item, index)=>{
                                    //data
                                    el = this.data[ix][p][index]; 
                                    v = el.hasOwnProperty('value')? el.value: el;
                                    this.data[ix][p][index] = {value:v, isDisabled:false};
                                    //dirty
                                    this.dirty[ix][p].push(false);
                                });
                            } else {
                                this.dirty[ix][p] = false;
                            }
                        }
                        
                    });
                },
                _env_reset:function(){
                    // 1.target
                    this.clearTarget();
                    //2.편집상태
                    this.seEditedState(false);
                },
                reset:function() {
                    //변경사항이 있을 때 실행..
                    if(this.isEditedState) {
                        this.init(this.org);
                        return this.data;
                    }
                    return false;
                },
                idirty:function(article){
                    const ix = this.data.indexOf(article);
                    if( ix < 0 ) return [];
                    return this.dirty[ix]
                },
                iorg:function(article){
                    const ix = this.data.indexOf(article);
                    if( ix < 0 ) return [];
                    return this.org[ix]
                },
                seEditedState:function(flag) {
                    //입력값이 없으면 default로 true를 반환한다.
                    this.isEditedState = (flag==undefined)? true:flag;
                },
                _new_data_Structure:function() {
                    return  {
                        index:'',
                        category:'',
                        word:'',
                        meaning:'',
                        examples:[
                            {value:'', isDisabled:false}
                        ],
                        keywords:[
                            {value:'', isDisabled:false}
                        ],
                        };
                },
                //article을 추가한다.
                add:function(category) {
                    //data, dirty신기작성
                    //만약 data가 객체라면 내부에 복제, 초기화, 특정항목초기화등을 지원할텐데..
                    const data = this._new_data_Structure(); 
                    const dirty = JSON.parse(JSON.stringify(data));
                    for(var p in data) {
                        if(data[p] instanceof Array) {
                            data[p][0].value='';
                            data[p][0].isDisabled=false;
                            dirty[p][0]=false;
                        } else {
                            data[p]='';
                            dirty[p]=false;
                        }
                    }
                    data['category'] = category;
                    this.data.push(data);
                    this.dirty.push(dirty);

                    //편집상태 공지
                    this.seEditedState();
                },
                //article내 배열데이터 추가. 
                //추가 시, 초기값 갖는 dirty도 추가시킨다.
                addItem:function(article,attr){
                    const ix = this.data.indexOf(article);
                    //this.data의 변화는 화면에 직접 영향을 주므로, dirty부터 갱신.
                    //화면이 갱신될때, dirty값을 읽어 태그 속성을 설정하고 있음.
                    this.dirty[ix][attr].push(false);
                    this.data[ix][attr].push({value:'',isDisabled:false});
                    //변경여부 공지
                    this.seEditedState();
                },
                //article을 갱신한다.
                update:function(article, attr, index, value) {
                    if(index!=null)
                        article[attr][index].value = value;
                        else
                        article[attr] = value;
                    //변경여부 공지
                    this.seEditedState();
                },
                //article을 삭제한다.
                remove:function(article) {
                    const ix = this.data.indexOf(article);
                    this.data.splice(ix,1);
                },
                //작업환경을 저장
                setTarget:function(env) {
                    this.target.a = env.article;
                    this.target.t = env.attr;
                    this.target.i = env.index;
                },
                //작업환경을 초기회
                clearTarget:function(env) {
                    this.target = {}
                },
                get_dirty:function(){
                    return this.idirty(this.target.a)[this.target.t][this.target.i];
                },
                reset_dirty:function() {
                    //설정된 현재 작업대상값을 이욯한다.
                    this.idirty(this.target.a)[this.target.t][this.target.i] = false;
                    this.target.a[this.target.t][this.target.i].isDisabled=false;
                    this.target={};
                },
                del_dirty:function(){
                    try{
                        // 해당 dirty를 undefined로 변경
                        // delete this.idirty(article)[attr][index];
                        delete this.idirty(this.target.a)[this.target.t][this.target.i];
                        // article[attr][index].isDisabled=true;
                        this.target.a[this.target.t][this.target.i].isDisabled=true;
                        
                        //변경여부 공지
                        this.seEditedState();
                        return true;

                    } catch (error) {
                        return false;
                    }
                },
                refresh:function(lst) {
                    //computed값이 넘어올 수도 있음.
                    if(!lst) {
                        lst = this.data;
                        // throw new Error('메모리스트 인수가 입력되지 않음.');
                    }
                    function isNotDeleted(value) {
                        return value!=undefined;
                    }
                    function isChanged(v1,v2) {
                        return v1.value != v2.value;
                    }
                    function hasOriginal(obj,p,i) {
                        return obj && obj[p][i];
                    }
                    lst.forEach((article) => {
                        for(var p in article) {
                            if (p=='org' || p=='dirty') {
                                continue;
                            }
                            let dirty = this.idirty(article);
                            let org = this.iorg(article);
                            //examples, keywords
                            if(article[p] instanceof Array) {
                                article[p].forEach( (item,ix) => {
                                    //메모틀이 새로 생성된 경우인지 확인위해 org를 조건에 추가.
                                    //항목이 추가된 것인지를 확인하기위해 org[p][ix]를 추가.
                                    if (hasOriginal(org,p,ix) &&
                                        isNotDeleted(dirty[p][ix]) &&
                                        isChanged(item, org[p][ix]) )
                                    {
                                        dirty[p][ix] = true;
                                    }
                                });
                            } else {
                                if (org && article[p] != org[p]) {
                                    dirty[p] = true;
                                }
                            }
                        }
                    });
                    console.log("[$service.refresh]", lst);

                    // 2.
                }
            }
        }
    }
    // exmplates, keyword의 동적 input tag에 대해 제어할 것이 많아
    // 컴포넌트화함.
    // 삭제기능(dirty에 undefinded인 경우만 삭제표시토록 함)
    Vue.component("li-tag", {
        props:['article', 'attr'],
        template:`<div>
            <li v-for="(item,index) in article[attr]" :class="getClass(article, attr, index)" :data-index="index">
                <input type="text" :name="attr" :value="item" :disabled="isDisabled(article, attr, index)"/>
                <button :name="attr+'.del'" type="button" :disabled="isDisabled(article, attr, index)">×</button>
            </li>
            </div>
        `,
        methods:{
            getClass:(a,t,i)=>{
                // 삭제대상인경우 deleted, 그렇지않으면 입력받은 클래스명을 반환한다.
                d = a.dirty[t][i]==undefined?true:false;
                console.log("class d",d);
                return d? 'deleted':t;
            },
            isDisabled:(article,attr,index)=>{
                //dirty에 삭제표시("")가 되어 있으면 disabled표시를 한다.
                d = article.dirty[attr][index]==undefined?true:false;
                console.log("d",d);
                return d;
            }
        }
    });
    
    Vue.component("word-template", {
        props:['categories'],
        template:`
            <form name="word_form" action='/memo/add' method='post'>
                <div>
                    <select name="category">
                        <option v-for="category in categories" :value="category" >{{category}}</option>
                    </select>
                </div>
                <div><input type="text" name="word"></div>
                <div><input type="text" name="meaning"></div>
                <ul class="article">
                    <li class="examples">
                        <input type="text" name="examples"/>
                    </li>
                    <button name="examples" @click="add">Add</button>
                </ul>
                <ul class="article">
                   <li class="keywords">
                        <input type="text" name="keywords">
                   </li>
                   <button name="keywords" @click="add">Add</button>
                </ul>
                <button @click="save">Save</button>
            </form>
        `,
        mounted:function(){
            const tag = document.querySelector("form[name='word_form'] input[name='word']");
            tag.focus();
        },
        methods:{
            save:function(el_add){
                // el_add.preventDefault();
                const form = el_add.target.parentNode;
                console.log(form.name)
            },
            validate:function(){

            },
            add:function(el_add){
                el_add.preventDefault();
                // console.log(el_add.target.parentNode);
                parentNode = el_add.target.parentNode;
                // 틀로 첫번째노드를 쓰도록 한다. 복제한후 내용은 지운다.
                templ = parentNode.firstChild.cloneNode(true);
                templ.firstChild.value="";
                // 마지막 노드앞에 삽입한다.
                parentNode.insertBefore(templ, parentNode.lastChild);
                templ.firstChild.focus();
            }
        }
    });

    Vue.use(stateService);

    const sliderTab = {
        template: "<div>tset slider</div>"
    }
    const app = new Vue(
        {
            el: "#app",
            components: {
                'slider-tab': sliderTab,
            },
            created: function () {
                this.getArticles();
            },
            watch: {
                //카테고리가 변경되면 편집 중인 상태를 원래대로 돌려놓는다.
                category:function(category){
                    //편집중인 template를 삭제한다.
                    this.word_templates = Array();
                    //편집상태일경우, 편집환경과 데이터를 초기화한다.
                    const r = this.$service.reset();
                    if (r) {
                        this.articles = r;
                    }
                }
            },
            data: {
                categories:[],
                category:'',
                articles:[],
                result_message:'',
                word_templates:[],
                addedItems:[]
            },
            mounted: function () {
                console.log("mounted");
            },
            beforeUpdate:function(){
                // console.log("beforeUpdate");
                // this.$forceUpdate();
            },
            updated:function() {
                // console.log("updated");
                // this.$forceUpdate();
            },
            computed: {
                cached: function() {
                    return this.articles.filter((a)=>{
                        return a.category == this.category;
                    });
                }
            },
            methods: {

                getArticles:function() {
                    const url="/memo/articles";
                    axios.get(url).then((res)=>{
                        this._callback(res);
                    });
                },
                addTemplate:function(){
                    this.word_templates.push("word-template");
                },
                add:function() {
                    this.$service.add(this.category);
                    this.writeMessage('새 틀이 준비되었습니다.');
                },
                addItem:function(article,attr,event) {
                    event.preventDefault();
                    
                    // 먼저 서비스에 추가 
                    app.$service.addItem(article,attr);
                    
                    //다음번 갱신주기에 삽입된 항목을 입력대기상태로 하게함.
                    this.$nextTick().then(()=>{
                        const frame = event.target.parentNode;
                        // 버튼직전 input태그를 찾는다.
                        let last = frame.lastChild.previousElementSibling;
                        while( last.nodeName != 'LI') {
                            last = last.previousElementSibling;
                        }

                        last.firstChild.focus();
                    });
                },
                _callback:function(res){
                        this.categories = res.data.cat;
                        if (!this.category || this.categories.indexOf(this.category) < 0) {
                            //직전 표시 카테고리에 데이터가 없을 경우
                            this.category = res.data.cat[0]
                        }
                        
                        // 서비스를 호출 (메모데이터, 원본, 체크객체)
                        this.$service.init(res.data.data);
                        console.log("$service.data",this.$service.data);

                        this.articles = this.$service.data;
                },
                updateAll:function(){

                    if (!this.$service.isEditedState) {
                        alert("수정된 내용이 없습니다.");
                        return false;
                    }
                    // dirty 체크를 수행한다.
                    // dirty, org 상태값을 서비스에 위임.
                    this.$service.refresh(this.cached);
                    // 편집상태를 초기화시킴.
                    this.$service.seEditedState(false);

                    const url = "/memo/updateAll";
                    // 수집을 통해 query작성.
                    const data= this._queryString();
                    console.log("updateAll",data);
                    
                    axios.post(url, data).then( res => {
                       this._callback(res);
                       this.writeMessage("수정사항이 적용되었습니다.");
                    //    alert("수정사항이 적용되었습니다.");
                    });
                },
                _queryString:function(){
                    // add:{index..}, mod:{index...}
                    // dirty체크를 통해 신규추가와 기존수정을 구분해 분류
                    let adds = [], mods = [], dels = [], news=[];
                    let result={};

                    this.cached.forEach( article => {
    
                        if(article.index=="") {
                            //새로추가항목
                            result = this._queryStringNew(article);
                        } else {
                            //수정항목
                            result = this._queryStringMod(article);
                        }
                    
                        if(result.new_!=undefined) {
                            news.push(result.new_);
                        }

                        if(result.add!=undefined &&
                        (result.add['examples']!=undefined || 
                        result.add['keywords']!=undefined) ) {
                            adds.push(result.add);
                        }

                        if(result.mod!=undefined &&
                        (Object.keys(result.mod['main']).length > 1 || 
                        result.mod['examples']!=undefined || 
                        result.mod['keywords']!=undefined) ) {
                            mods.push(result.mod);
                        }

                        if(result.del!=undefined &&
                        (Object.keys(result.del['main']).length > 1 || 
                        result.del['examples']!=undefined || 
                        result.del['keywords']!=undefined) ){
                            dels.push(result.del);
                        }
                    });

                    //인터페이스에 맞게 조정.
                    return {add:adds, mod:mods, del:dels, new_:news};
                },
                _queryStringNew:function(article) {
                    ['examples','keywords'].forEach((e)=>{
                        article[e].forEach( (item,index) => {
                            article[e][index] = item.value;
                        });
                    });
                    return {new_:{
                        main:[article.category, article.word, article.meaning],
                        examples:article.examples,
                        keywords:article.keywords
                    }};
                },
                _queryStringMod:function(article) {
                    
                    let add = {index:article.index},
                        mod = {main:{index:article.index}},
                        del = {main:{index:article.index}},

                    // org = article['org'];
                    org = this.$service.iorg(article);
                    // dirty = article['dirty'];
                    dirty = this.$service.idirty(article);
                    
                    ['category', 'word','meaning','examples','keywords'].forEach( b => {

                        if ( article[b] instanceof Array ) {
                            let el_add = Array();
                            let el_mod = {index:[], data:[]};
                            let el_del = {index:[], data:[]};
                            
                            for(var c=0; c < article[b].length;c++) {
                                // 추가항목 수집
                                if( article[b][c]!="" && (!org[b][c] || org[b][c]==undefined) ) {
                                    // 원본에 없으면 추가항목으로 간주.
                                    el_add.push( article[b][c].value );

                                } else if( dirty[b][c]==null ) {
                                    //dirty가 ""이면 삭제로 함
                                    el_del.index.push( c );
                                    el_del.data.push( article[b][c].value );

                                } else if (dirty[b][c]) {
                                    el_mod.index.push( c );
                                    el_mod.data.push( article[b][c].value );
                                }
                            }
                            if(el_add.length > 0) {
                                add[b] = el_add;
                            }
                            if(el_mod.index.length > 0) {
                                mod[b] = el_mod;
                            }
                            if(el_del.index.length > 0) {
                                del[b] = el_del;
                            }
                        } else {
                            if (dirty[b]) {
                                mod.main[b] = article[b];
                            }
                        }
                    });
                
                return {add:add, mod:mod, del:del};
                },
                // 한개의 메모세트를 삭제함
                click_02:function(article, event) {
                    event.preventDefault();

                    const yn = confirm("메모를 삭제하시겠습니까?")
                    if(!yn) return false;
                    
                    if(article.index=='') {
                      //새 틀을 저장없이 삭제
                      this.$service.remove(article);
                      return null;
                    } 
                    const data = {index:article.index}
                    const url = "/memo/removeArticle"
                    axios.post(url,data).then(res => {
                        this._callback(res);
                    });

                },
                //ul의 부모태그에서 자식태그내 삭제이벤트 처리
                click_01:function(article, event){
                    event.preventDefault();
                    const button_tag = event.target;
                    if (button_tag.tagName.toLowerCase()!='button') return null;

                    function getType(name, type) {
                        const splited_name = name.split(".");
                        if(splited_name.length==1) {
                            // 타입정보로서 공백을 설정.
                            splited_name.push("");
                        }
                        return (type.toLowerCase()=='type')? splited_name[1]:splited_name[0];                        
                    }
                    const tag_name = button_tag.getAttribute('name'),
                          index = button_tag.parentNode.getAttribute('data-index'),
                          button_type = getType(tag_name,'type'),
                          attr = getType(tag_name,'attr');
                          
                    // 삭제기능호출여부 검사
                    if (tag_name && button_type=='del') {
                        this._deleteItem(article, attr, index);
                    }
                },
                _deleteItem:function(article, attr, index) {
                    //현재 작업환경을 설정한다.
                    const target = {article:article, attr:attr, index:Number(index)};                    
                    try {
                        this.$service.setTarget(target);

                        if (this.$service.get_dirty()==undefined) {
                            this.$service.reset_dirty();
                        } else {
                            //삭제하면 몇번째 항목이 삭제되었는지 추적이 불가 -> 상태값을 ""로 변경하는 것으로 함.                    
                            if(!this.$service.del_dirty()) {
                                throw new Exception("삭제시 에러발생")
                            }
                        }
                    } catch (error) {
                        alert(error);
                        return null;
                    } finally {
                        this.$service.clearTarget();
                    }
                },
                change_01:function(article, event){
                    const input_tag = event.target;
                    const tag_name = input_tag.tagName,
                          attr = input_tag.getAttribute("name"),
                          value = (tag_name=='SELECT')? input_tag.options[input_tag.selectedIndex].value
                                       :input_tag.value;

                    this.$service.update(article, attr,null,value);
                    console.log(tag_name, attr, value);
                },
                //examples가 변경될었을때, 수행.
                change_02:function(article, event){
                    console.log(event.target.tagName);
                    if (!event.target.tagName.toLowerCase().match(/input/)) {
                        return;
                     }
                     console.log(event.target.parentNode.getAttribute('[change02]data-index'));
                     
                     input_tag = event.target;
                     frame = input_tag.parentNode;
                     // input태그의 이름을 가져온다.
                     const attr = input_tag.getAttribute('name'),
                           value = input_tag.value,
                           index = (frame.getAttribute("data-index")==undefined)? 0
                                             : Number(frame.getAttribute("data-index"));

                    this.$service.update(article,attr,index, value);
                    
                     console.log("ar mod2:", value, attr, index);
                },
                change_03:function(){
                    this.$el.querySelectorAll("[disabled]")
                    .forEach(tag => {
                        tag.parentNode.removeAttribute("class");
                        tag.removeAttribute("disabled");
                    });
                },
                getClass:function(article,attr,index){
                    // 삭제대상인경우 deleted, 그렇지않으면 입력받은 클래스명을 반환한다.
                    return this.isDisabled(article,attr,index)? 'deleted':attr;
                },
                isDisabled:function(article,attr,index) {
                    //dirty에 삭제표시(undefined)가 되어 있으면 disabled표시를 한다.
                    // d = article.dirty[attr][index]==undefined?true:false;
                    d = this.$service.idirty(article)[attr][index]==undefined?true:false;
                    // console.log("check",d);
                    return d;
                },
                formSerialize:function(){
                    form_elements = [];
                    for(var i=0;i<document.forms.length;++i) {
                        let j=0;
                        let s_form_elements = [];
                        const s_form = document.forms[i];
                        while(s_form[j]!=undefined) {
                            if(s_form[j].nodeName.toLowerCase()!='button') {
                                const tar = s_form[j];
                                const key = tar.getAttribute('name');
                                let value = '';
                                let found=false;

                                if(tar.nodeName=='SELECT') {
                                    value = tar.options[tar.selectedIndex].text;
                                } else {
                                    value = tar.value;
                                }
                                
                                s_form_elements.forEach( el => {
                                    if (Object.keys(el)[0] == key) {
                                        found = true;
                                        if(el[key] instanceof Array) {
                                            el[key].push(value);
                                        } else {
                                            el[key] = [el[key], value];
                                        }
                                    }
                                });

                                if(!found) {
                                    var el_add = new Object();
                                    el_add[key] = value;
                                    s_form_elements.push(el_add);
                                }
                            }
                            j++;
                        }
                        form_elements.push(s_form_elements);
                    }
                    return form_elements;
                },
                writeMessage:function(msg) {
                    this.result_message = msg;
                    setTimeout(()=>{this.result_message=''}, 3000);
                },
            }
        });
}