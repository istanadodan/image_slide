import os
import cv2, numpy as np
from utils import auto_log, getLogger
_logger = getLogger(__name__)
d = { 'moduleName':__name__}

class Cascader:
    
    def __init__(self, dir, classifier, data, scaleFactor):
        # 안면인식데이타를 지정한다.
        self.base_dir = dir
        self.data = data
        _logger.debug("classifier {}".format(classifier),extra=d)
        # temp = "D:\\haarcascade_frontalface_default.xml"
        # self.cascade = cv2.CascadeClassifier(temp)
        self.cascade = cv2.CascadeClassifier(classifier)
        self._operate(scaleFactor)

    def _operate(self, scaleFactor):

        for el in self.data:
            fullpath = os.path.join(self.base_dir, el['filename'])
            _logger.debug("fullpath {}".format(fullpath),extra=d)

            img = self.imread(fullpath)
            try:
                gray = cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
                faces = self.cascade.detectMultiScale(gray, scaleFactor=scaleFactor)                
                _logger.debug("faces {}".format(len(faces)),extra=d)
                if len(faces) > 0:
                    import json
                    el['KO'] = True
                    el['KO_plotting'] = faces.tolist()
                    _logger.debug("결과 {}".format(el),extra=d)
                else:
                    el['KO'] = False
                    el['KO_plotting'] = ''

            except Exception as e:
                _logger.debug(e,extra=d)

    def getList(self):
        return self.data

    def imread(self, filename, flags=cv2.IMREAD_COLOR):
        # filename = path.split("\\")[-1]
        # os.chdir(path.replace(filename,''))
        try:
            buf = np.fromfile(filename, np.uint8)
            img = cv2.imdecode(buf, flags)
            return img

        except Exception as e:
            return None

    def show_image(self):
        if not self.img:
            return

        for (x,y,w,h) in self.faces:
            cv2.rectangle(self.img, (x,y), (x+w, y+h),(0,0,255))
        cv2.imshow('test',img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()