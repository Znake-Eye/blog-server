import multer from "multer";
import fs from "fs";

export class MulterImageUploader {
    private storeFolderLocation: string = '';

    constructor(storeLocation: string) {
        this.storeFolderLocation = storeLocation;
    }

    private storage = multer.diskStorage({
        destination: (req, file, cb) => {
            if(!fs.existsSync(this.storeFolderLocation)) {
                fs.mkdirSync(this.storeFolderLocation, { recursive: true});
            }
            cb(null, this.storeFolderLocation);
        },
        filename: (req, file, cb) => {
            const fileName = `${Date.now()}-${file.originalname}`
            cb(null, `${fileName}`);
        }
    });

    private fileFilter = (req, file, cb) => {
        // cb(null, true);
        const allowFileTypes= ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if(allowFileTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }

    public upload = multer({ storage: this.storage, fileFilter: this.fileFilter });

}