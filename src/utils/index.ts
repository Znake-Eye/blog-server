
import fs from "fs";
export const removeFile = (pathName: string) => {
    if (fs.existsSync(pathName)) {
        fs.unlinkSync(pathName);
        return true;
    }
    return false;
}