import multer from "multer"
import path from "path";
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname); // get file extension
      const uniqueName = `${file.fieldname}-${Date.now()}${ext}`; // e.g. avtar-1680000000.jpg
      cb(null, uniqueName);
    }
  
  })
  
export  const upload = multer({ storage: storage })