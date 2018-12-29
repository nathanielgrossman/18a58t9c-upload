const sharp = require('sharp');
const path = require("path");
const stream = require('stream');
const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const Image = require('./image-schema');

const { parseConfig, findImages } = require('./utils')
const { getAverage, saveRecord, resizeAndUpload, deleteFile } = require('./process')

const configFile = path.resolve(process.cwd(), '18a58t9c.config.json');
parseConfig(configFile)

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true })

const dir = path.resolve(process.cwd())

const images = findImages(dir);

let imageTasks = images.map(image => {
    return new Promise((resolve, reject) => {
        getAverage(image)
            .then(metadata => saveRecord(metadata))
            .then(metadata => resizeAndUpload(metadata))
            .then(metadata => deleteFile(metadata))
            .then(metadata => {
                resolve(metadata.id)
            })
            .catch(err => reject(err))
    })
})

Promise.all(imageTasks)
    .then(ids => {
        console.log(`Successfully created the following ${ids.length} entries: ${ids}`);
        mongoose.disconnect();
    })
    .catch(err => console.log(err))