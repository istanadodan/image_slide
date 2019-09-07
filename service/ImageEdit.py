from PIL import Image
from utils import auto_log, getLogger
import os
_logger = getLogger(__name__)
d = { 'moduleName':__name__}

class ImageEdit:
    edited = list()
    KEY = 'filename'

    def __init__(self, dir_path, data, opt):
        self.basedir = dir_path
        self.data = data
        self.opt = opt #rotate_degree:90, -90
        self.run()
        _logger.debug("option %s"%(self.opt),extra=d)

    def run(self):
        for element in self.data:
            copied = element.copy()
            if 'degree' in self.opt:
                new_element = self.doRotate(copied, 'degree')
                self.edited.append(new_element)
            elif 'quality' in self.opt:
                new_element = self.changeQuality(copied, 'quality')
                self.edited.append(new_element)
    @auto_log(__name__)
    def changeQuality(self, element, key):
        _logger.debug("element {}".format(element),extra=d)
        quality = int( self.opt[key] )
        filename = element[self.KEY]
        file, ext = os.path.splitext(filename)

        new_filename = file.replace('_quality','') +'_quality' + ext
        tgt_path = os.path.join(self.basedir, new_filename)
        src_path = os.path.join(self.basedir, filename)
        try:
            with Image.open(src_path) as img:
                _logger.debug("quality %d %s"%(quality, ext[1:]),extra=d)
                img.save(tgt_path, quality=quality)
                element['quality'] = quality
                element['filename'] = new_filename

            return element

        except Exception as e:
            _logger.debug("error: {}".format(filename),extra=d)
            _logger.debug(e,extra=d)
            return False

    def doRotate(self, element, key):
        _logger.debug("element {}".format(element),extra=d)
        degree = int( self.opt[key] )
        filename = element[self.KEY]
        file, ext = os.path.splitext(filename)

        new_filename = file.replace('_rotate','') +'_rotate' + ext
        tgt_path = os.path.join(self.basedir, new_filename)
        src_path = os.path.join(self.basedir, filename)
        try:
            with Image.open(src_path) as img:
                w, h = img.size
                _logger.debug("degree %d %s"%(degree, ext[1:]),extra=d)
                rot_img = img.rotate(degree, expand=True, resample=Image.BICUBIC)
                rot_img.save(tgt_path, quality=100)
                element['size'] = dict(width=w,height=h)
                element['filename'] = new_filename

            return element

        except Exception as e:
            _logger.debug("error: {}".format(filename),extra=d)
            _logger.debug(e,extra=d)
            return False

    def getList(self):
        return self.edited