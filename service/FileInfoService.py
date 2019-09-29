import os, json
import pandas as pd
import logging
_logger = logging.getLogger(__name__)

class FileInfo:
    caches = dict()
    workcache = dict()
    # 수정사항이 있는지 점검하기위한 내부변수
    dirt = False
    # 설정파일명을 담는다
    json_filename = ''

    def __init__(self, path):
        self.d = {'moduleName':__name__}
        self.path = path;
        self.album_name = path.split('\\')[-1]
        _logger.debug("워크캐쉬: {}".format(self.workcache),extra=self.d)
        _logger.debug("패스:{},북이름:{}".format(self.path,self.album_name),extra=self.d)

        # 캐시를 확인해 존재하면 후속처리가 필요없으므로 복귀한다.
        if path in self.caches:
            return
        
        # 파일로부터 읽어온다. 파일이 없으며 []값을 반환받음.
        self.workcache = self.read()
        
        # 작성된 내역을 검증한다.
        self.check()
    
        # 등록되지않은 파일정보를 새로생성하여 추가한다.
        self.register()

        # 변동사항이 있으면 갱신한 자료를 저장한다.
        self.save()

        # 캐시에 저장한다.
        self.caches[path] = self.workcache

    def save(self):
        if self.dirty:
            filename = self.json_filename or 'image_info.json'
            f_path = os.path.join(self.path, filename)
            with open(f_path,"w") as f:
                json.dump(self.workcache, f)

    def register(self):
        gen = (t for t in os.listdir(self.path) if os.path.splitext(t)[1].lower()=='.jpg')
        for filename in gen:
            if not self.hasElement(filename):
                if not self.dirty: self.dirty = True
                full_path = os.path.join(self.path, filename)
                el = InfoElement({'filename':filename, 'album':self.album_name, 'size':os.path.getsize(full_path)})
                _logger.debug("path:{}, element:{}".format(full_path, el.size))
                # el = self.create_element(f)
                self.workcache.append(el.get_data())

    def check(self):
        self.dirty = False
        tmp = list()
        # 새로 내용을 작성해 워크캐쉬에 넣는다.
        for index, item in enumerate(self.workcache):
            _logger.debug("workcashe %s" %(self.workcache))
            if not os.path.exists(os.path.join(self.path, item['filename'])):
                if not self.dirty: self.dirty = True
                # 파일이 존재하지 않는 항목은 삭제
                # del self.workcache[index]
                _logger.debug("[파일내역삭제] {0}".format(item['filename']),extra=self.d)
            else:
                tmp.append(item)

        self.workcache = tmp

    def read(self):
        # 반환값
        ret = list()

        # path내 json파일을 조사한다.
        for f in os.listdir(self.path):
            file_path = os.path.join(self.path, f)
            if os.path.isfile(file_path) and os.path.splitext(f)[1].lower() == '.json':
                if not self.json_filename:
                    self.json_filename = f

                with open(file_path,"r") as f:
                    info_json = json.load(f)

                # 파일내용을 합쳐 하나의 배열에 저장한다.
                # 편의상 중복 점검은 하지 않음.
                ret.extend(info_json)
        
        return ret
    
    def hasElement(self, filename):
        for index, el in enumerate(self.workcache):
            if el['filename'] == filename:
                return True
        return False

    # 작성된 자료를 반환한다.
    def getList(self):
        return self.caches[self.path]
    
    # def update2(self, element):
        # df = pd.DataFrame(self.caches[self.path])
        # df.index = df['filename']
        # self._log("df",df.head())
        
        # if type(element)!=list:
        #     element = list([element])
        
        # self._log("element",element)

        # for e in element:
        #     # df.loc[df['filename'] == e['filename']] = pd.DataFrame(pd.Series(e, index=df.columns), ignore_index=True)
        #     index = df.loc[df['filename'] == e['filename']].index[0]
        #     df = df.drop(index)
        #     self._log("found index",index)
        #     df.loc[index] = e
        #     self._log("df3",df.iloc(index))

    def update(self, element):
        KEY ='filename'
        self.workcache = self.caches[self.path]

        if type(element)!=list:
            element = list([element])

        for src_el in element:
            for ix, el in enumerate(self.workcache):
                if el[KEY] == src_el[KEY]:
                    self.workcache[ix] = src_el
                    _logger.debug("수정 {}".format(src_el),extra=self.d)
                    break

        # 수정사항을 저장한다.
        self.dirty = True
        self.save()
        self.dirty = False

        self.caches[self.path] = self.workcache
    
    def append(self, element):
        KEY ='filename'
        self.workcache = self.caches[self.path]

        if type(element)!=list:
            element = list([element])
        
        for el in (e for e in element if not self.hasElement(e[KEY])):
            self.workcache.append(el)
            _logger.debug("추가 {}".format(el),extra=self.d)

        # 수정사항을 저장한다.
        self.dirty = True
        self.save()
        self.dirty = False

        self.caches[self.path] = self.workcache
    
    def remove(self, element):
        KEY ='filename'
        self.workcache = self.caches[self.path]

        if type(element)!=list:
            element = list([element])
        
        for src_el in element:
            for ix, el in enumerate(self.workcache):
                if el[KEY] == src_el[KEY]:
                    full_path = os.path.join(self.path, el['filename'])
                    if os.path.exists(full_path):
                        os.remove(full_path)
                    del self.workcache[ix]
                    _logger.debug("삭제 {}".format(src_el),extra=self.d)
                    break

        # 수정사항을 저장한다.
        self.dirty = True
        self.save()
        self.dirty = False

        self.caches[self.path] = self.workcache

class InfoElement:
    filename =''
    album=''
    HQ=False
    KO=False
    ME=False
    place=''
    memo=''
    KW=[]
    size=''

    def __init__(self, element):
        # 조건문이 붙은 순환문을 만들기위해 제너레이터를 사용함
        for key in (key for key in InfoElement.__dict__.keys() if key in element):
            setattr(self,key,element[key])

    def get_data(self):
        new_element = dict()
        # 함수타입을 제외한 속성값을 대상으로 함
        for key in (key for key in InfoElement.__dict__.keys() if not key.startswith('_') and not callable(InfoElement.__dict__[key])):
            _logger.debug("key: ",key)
            new_element[key] = getattr(self,key)
        return new_element

if __name__ == '__main__':
    import pprint as pp
    fi = FileInfo("D:\\내사진\\Album 2019\\190112-우에노")
    pp.pprint(fi.getList())