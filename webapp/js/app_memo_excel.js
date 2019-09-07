const basedir = "webapp/";

function init() {
    Vue.component("slider-tab", {
        props: ['isopen', 'img_src'],
        template: `<div v-show='isopen'>
                    <div id="slider_button">
                        <button @click='sliding_start'>슬라이딩 재생</button>
                        <button @click='sliding_stop'>슬라이딩 중지</button>
                        <button @click='next'>다음이미지</button>
                        <button @click='pre'>이전이미지</button>
                    </div>
                    <div id="slideImg">
                        <img :src='img_src' height='480px' @click='onClose'/>
                    </div>
                   </div> 
                `,
        data: function () {
            return {
                message: '',
                auto:false
            };
        },
        methods: {
            next() {
                // this.sliding_stop();
                this.$emit('navi', 1); //순방향 1, 역방향 -1
            },
            pre() {
                // this.sliding_stop();
                this.$emit('navi', -1); //순방향 1, 역방향 -1
            },
            onClose() {
                this.sliding_stop();
                this.$emit('close_viewer');
            },
            sliding_start() {
                this.send_message("슬라이딩 개시");
                this.auto = true
                this.$emit("sliding", true);
            },
            sliding_stop() {
                if (this.auto){
                    this.send_message("슬라이딩 중지");
                    this.auto = false
                    this.$emit("sliding", false);
                }
            },
            send_message(msg) {
                this.$emit("sendmsg", msg);
            }

        }
    });

    const sliderTab = {
        template: "<div>tset slider</div>"
    }
    const app = new Vue(
        {
            el: "#app",
            components: {
                'slider-tab': sliderTab
            },
            created: function () {
                const article = {
                    word:'test',
                    meaning:'테스트',
                    examples:[
                        "테스트하다.",
                        "시험보다"
                    ],
                    keywords:[
                        '테스트',
                        '시험'
                    ]
                };
                this.categories = [
                    "category1",
                    "category2",
                ]
                this.articles = [
                    article,
                    article,
                ]
            },
            watch: {
                articles:function(arr) {
                    console.log("changed");
                }
            },
            data: {
                categories:[],
                articles:[],
                article:{},
                result_message:''
            },
            mounted: function () {
            },
            computed: {
                cached: {
                }
            },
            methods: {
                modify_article_word: function(article){
                    console.log(article);
                }
            }
        });

}
