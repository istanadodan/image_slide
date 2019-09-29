const basedir = "webapp/";

function init() {
    const stateService = {
        install:function(Vue, options) {
            
            Vue.prototype.$service = {
                isEditedState:false,
                data:[],
                org:[],
                dirty:[],
                deleted_item:[],
                init:function(data) {
                    this.data=data;
                    this.org = JSON.parse(JSON.stringify(data));
                    this.initialize();
                },
                initialize:function(){
                    this.data.forEach( (e, ix) => {
                        this.dirty[ix] ={};
                        for(const p in e) {
                            if( e[p] instanceof Array ) {
                                this.dirty[ix][p] = [];
                                e[p].forEach((item, index)=>{
                                    this.dirty[ix][p].push(false);
                                });
                            } else {
                                this.dirty[ix][p] = false;
                            }
                        }
                        
                    });
                },
                reset:function() {
                    //변경사항이 있을 때 실행..
                    if(this.isEditedState) this.init(this.org);
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
                add:()=>{

                },
                del_dirty:function(article,attr,index){
                    try{
                        // 해당 dirty를 undefined로 변경
                        delete this.idirty(article)[attr][index];
                        //변경사항이 있으면 플래그를 변경한다.
                        if(!this.isEditedState) this.isEditedState=true;
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
                    this.deleted_item = [];

                    lst.forEach((memo) => {
                        for(var p in memo) {
                            if (p=='org' || p=='dirty') {
                                continue;
                            }
                            let dirty = this.idirty(memo);
                            let org = this.iorg(memo);
                            if(memo[p] instanceof Array) {
                                memo[p].forEach( (item,ix) => {
                                    //삭제된 항목을 수집한다.
                                    if (dirty[p][ix]==undefined) {
                                        this.deleted_item.push(memo[p]);
                                    }
                                    // 삭제된 항목이 아니고 원본과 값이 다른지 확인.
                                    else if (dirty[p][ix]==false && item != org[p][ix]) {
                                        dirty[p][ix] = true;
                                    }
                                });
                            } else {
                                if (memo[p] != org[p]) {
                                    dirty[p] = true;
                                }
                            }
                        }
                    });
                    console.log("[$service.refresh]", lst);
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
        methods:{
            save:function(tmp_add){
                // tmp_add.preventDefault();
                const form = tmp_add.target.parentNode;
                console.log(form.name)

            },
            validate:function(){

            },
            add:function(tmp_add){
                tmp_add.preventDefault();
                // console.log(tmp_add.target.parentNode);
                parentNode = tmp_add.target.parentNode;
                // 틀로 첫번째노드를 쓰도록 한다. 복제한후 내용은 지운다.
                templ = parentNode.firstChild.cloneNode(true);
                templ.firstChild.value="";
                // 마지막 노드앞에 삽입한다.
                parentNode.insertBefore(templ, parentNode.lastChild);
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
                // articles:{
                //     handler:'calculate_dirty',
                //     deep:true
                // },
                //카테고리가 변경되면 편집 중인 상태를 원래대로 돌려놓는다.
                category:function(category){
                    this.$service.reset();
                    this.articles = [];
                    this.articles = this.$service.data;
                    document.querySelectorAll('li.deleted').forEach(tag=>{
                        tag.removeAttribute("class");
                });
                    document.querySelectorAll('[disabled]').forEach(tag=>{
                            tag.removeAttribute("disabled");
                            // tag.setAttribute("disabled",false);
                    });
                },
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
                console.log("beforeUpdate");
                // this.$forceUpdate();
            },
            updated:function() {
                console.log("updated");
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
                    // let frame = document.querySelector('#right');
                    // const tmpl = document.createElement('word-template');
                    // // tmpl.setAttribute(':articles', "cached");
                    // tmpl.setAttribute(':categories', "categories")
                    // frame.appendChild(tmpl);
                    this.word_templates.push("word-template");
                },
              
                add:function(event) {
                    event.preventDefault();
                    const frame = event.target.parentNode;
                    // 버튼직전 input태그를 찾는다.
                    let last = frame.lastChild.previousSibling;
                    while( last.nodeName != 'LI') {
                        last = last.previousSibling;
                    }
                    // li안의 input tag
                    const last_input_tag =last.firstChild;
                                        
                    const index = (last.getAttribute("data-index")==undefined)? 1
                                                : Number(last.getAttribute("data-index")) + 1;
                    
                    const new_li = last.cloneNode(true);
                    new_li.firstChild.value = "";
                    new_li.setAttribute('data-index', index);
                    const added = frame.insertBefore(new_li, last.nextSibling);
                    this.addedItems.push( added );
                    new_li.firstChild.focus();
                },
                _callback:function(res){
                        // this.$nextTick().then(()=>{
                                                // });
                        
                        this.categories = res.data.cat;
                        if (!this.category || this.categories.indexOf(this.category) < 0) {
                            //직전 표시 카테고리에 데이터가 없을 경우
                            this.category = res.data.cat[0]
                        }
                        
                        this.articles = res.data.data;
                        // this.articlesClone();
                        console.log("articles ", this.articles)

                        // 서비스를 호출 (메모데이터, 원본, 체크객체)
                        this.$service.init(res.data.data);
                        console.log("$service.data",this.$service.data);
                },
                updateAll:function(){
                    // dirty 체크를 수행한다.
                    // this.calculate_dirty();
                    this.$service.refresh(this.cached);

                    //임의로 추가된 DOM구조를 제거한다.
                    //nextTick주기에 구조가 새로 생성된다.
                    while (this.addedItems.length>0) {
                        const tag = this.addedItems.pop();
                        tag.parentNode.removeChild(tag);
                    }
                    
                    const url = "/memo/updateAll";
                    const data= this.doCollectChg();
                    console.log("data",data);
                    
                    axios.post(url, data).then( res => {
                       this._callback(res);
                    });
                },
                doCollectChg:function(){
                    // add:{index..}, mod:{index...}
                    // dirty체크를 통해 신규추가와 기존수정을 구분해 분류
                    let adds = [], mods = [], dels = [];
                    this.cached.forEach( article => {

                        let add = {index:article.index},
                            mod = {main:{index:article.index}},
                            del = {main:{index:article.index}};

                        // org = article['org'];
                        org = this.$service.iorg(article);
                        // dirty = article['dirty'];
                        dirty = this.$service.idirty(article);
                        
                        ['category', 'word','meaning','examples','keywords'].forEach( b => {

                            if ( article[b] instanceof Array ) {
                                let tmp_add = Array();
                                let tmp_mod = {index:[], data:[]};
                                let tmp_del = {index:[], data:[]};
                                for(var c=0; c < article[b].length;c++) {
                                    // 추가항목 수집
                                    if( article[b][c]!="" && (!org[b][c] || org[b][c]==undefined) ) {
                                        // 원본에 없으면 추가항목으로 간주.
                                        tmp_add.push( article[b][c]);

                                    } else if( dirty[b][c]==null ) {
                                        //dirty가 ""이면 삭제로 함
                                        tmp_del.index.push( c );
                                        tmp_del.data.push( article[b][c] );

                                    } else if (dirty[b][c]) {
                                        tmp_mod.index.push( c );
                                        tmp_mod.data.push( article[b][c] );
                                    }
                                }
                                if(tmp_add.length > 0) {
                                    add[b] = tmp_add;
                                }
                                if(tmp_mod.index.length > 0) {
                                    mod[b] = tmp_mod;
                                }
                                if(tmp_del.index.length > 0) {
                                    del[b] = tmp_del;
                                }
                            } else {
                                if (dirty[b]) {
                                    mod.main[b] = article[b];
                                }
                            }
                        });

                        if(add['examples']!=undefined || add['keywords']!=undefined) {
                            adds.push(add);
                        }

                        if(Object.keys(mod['main']).length > 1 || mod['examples']!=undefined || mod['keywords']!=undefined) {
                            mods.push(mod);
                        }

                        if(Object.keys(del['main']).length > 1 || del['examples']!=undefined || del['keywords']!=undefined) {
                            dels.push(del);
                        }
                    });
                    // add=[{index:1, examples:['test10','test20'], keywords:['keyword10','keyword20']}]
                    //mod=[{main:{index:1,category:'word1',word:'w1',meaning:'m1'},examples:{index:[1],data:['dfdfdf']},keywords:{index:[3],data:['ttttttt']}}];
                    return {add:adds, mod:mods, del:dels};
                },
                // 한개의 메모세트를 삭제함
                click_02:function(article, event) {
                    event.preventDefault();
                    const data = {index:article.index}
                    const url = "/memo/removeArticle"
                    axios.post(url,data).then(res => {
                        this._callback(res);
                    });

                },
                //ul의 부모태그에서 자식태그내 삭제이벤트 처리
                click_01:function(article, event){
                    event.preventDefault();

                    function getType(name, type) {
                        const splited_name = name.split(".");
                        if(splited_name.length==1) {
                            splited_name.push("");
                        }
                        return (type.toLowerCase()=='type')? splited_name[1]:splited_name[0];                        
                    }
                    const button_tag = event.target,
                          tag_name = button_tag.getAttribute('name');

                    // 삭제기능호출여부 검사
                    if (!tag_name || getType(tag_name,'type')!='del') {
                        return;
                    }
                    const button_type = getType(button_tag.getAttribute('name'),'type'),
                          attr = getType(button_tag.getAttribute('name'),'attr'),
                          index = button_tag.parentNode.getAttribute('data-index');

                    // article[attr].splice(index,1);
                    //삭제하면 몇번째 항목이 삭제되었는지 추적이 불가 -> 상태값을 ""로 변경하는 것으로 함.
                    // delete article.dirty[attr][index];
                    // delete this.$service.idirty(article)[attr][index];
                    if(!this.$service.del_dirty(article,attr,index)) {
                        console.log("에러",article);
                        alert("삭제시 에러발생");
                        return null;
                    }

                    // 태그를 삭제한후 서버에서 데이터를 개신하면, 기존 태그 하나가 삭제되어 버림.
                    // button_tag.parentNode.parentNode.removeChild(button_tag.parentNode);
                    button_tag.parentNode.setAttribute('class', 'deleted');
                    // input태그가 포함된 태그내 모든 element태그에 class속성을 추가설정
                    button_tag.parentNode.childNodes.forEach(tag=>{
                        if(tag.nodeType==tag.ELEMENT_NODE)
                            tag.setAttribute("disabled","disabled");
                    });
                    // button_tag.setAttribute('disabled', "disabled");
                    // button_tag.previousElementSibling.setAttribute('disabled', "disabled");                    
                    console.log("parentNode",button_tag.parentNode);
                    console.log("article",article[attr]);
                },
                change_01:function(article, event){
                    const input_tag = event.target;
                    const tag_name = input_tag.tagName,
                          attr = input_tag.getAttribute("name"),
                          value = (tag_name=='SELECT')? input_tag.options[input_tag.selectedIndex].value
                                       :input_tag.value;

                    article[attr] = value;
                    console.log(tag_name, attr, value);
                },
                //examples가 변경될었을때, 수행.
                change_02:function(article, event){
                    console.log(event.target.tagName);
                    if (!event.target.tagName.toLowerCase().match(/input/)) {
                        return;
                     }
                     console.log(event.target.parentNode.getAttribute('data-index'));
                     
                     input_tag = event.target;
                     frame = input_tag.parentNode;
                     // input태그의 이름을 가져온다.
                     const attr = input_tag.getAttribute('name'),
                           value = input_tag.value,
                           index = (frame.getAttribute("data-index")==undefined)? 0
                                             : Number(frame.getAttribute("data-index"));

                     article[attr][index] = value;
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
                    console.log("check",d);
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
                                    var tmp_add = new Object();
                                    tmp_add[key] = value;
                                    s_form_elements.push(tmp_add);
                                }
                            }
                            j++;
                        }
                        form_elements.push(s_form_elements);
                    }
                    return form_elements;
                }
            }
        });
}
