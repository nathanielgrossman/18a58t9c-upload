const fs = require("fs");

function parseConfig(configFile) {
    if (fs.existsSync(configFile)) {
        let config = JSON.parse(fs.readFileSync(configFile))
        process.env.BUCKET = config.bucket;
        process.env.AWS_ACCESS_KEY = config.aws_access_key;
        process.env.AWS_SECRET_ACCESS_KEY = config.aws_secret_access_key;
        process.env.MONGO_URI = config.mongo_uri;
        process.env.QUALITY = config.quality;
        process.env.THUMB_QUALITY = config.thumb_quality;
        process.env.THUMB_SIZE = config.thumb_size;
    } else {
        console.error('No config file present in current directory.');
        process.exit(1);
    }
}

function findImages(dir) {
    let files = fs.readdirSync(dir);
    const matched = files.filter(file => {
        let ln = file.length - 4;
        return (file.substr(ln) == '.jpg')
    })
    return matched;
}


module.exports = {
    parseConfig,
    findImages
}