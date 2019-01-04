const fs = require("fs");
const path = require("path");
const average = require('image-average-color');
const sharp = require('sharp');
const stream = require('stream');
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });

const s3 = new AWS.S3();

const Image = require('./image-schema');

function getAverage(image) {
    const metadata = { filename: image }
    return new Promise((resolve, reject) => {
        metadata.path = path.resolve(process.cwd(), image);
        average(metadata.path, (err, color) => {
            if (err) reject(err);
            else {
                color.pop();
                metadata.color = `rgb(${color.join(', ')})`;
                console.log('average found for ', image);
                resolve(metadata);
            }
        })
    })
}

function saveRecord(metadata) {
    return new Promise((resolve, reject) => {
        const newImage = new Image({
            original: metadata.filename,
            color: metadata.color
        })
        newImage.save((err, image) => {
            if (err) reject(err);
            else {
                console.log('record saved for ', metadata.filename);
                metadata.id = image._id;
                resolve(metadata);
            }
        })
    })
}


// {
//   filename: 'test.jpg',
//   path: './test.jpg',
//   color: 'rgb(24,25,52,255)',
//   id: '3f9239hf03hf209h3'
// }




function resizeAndUpload(metadata) {
    return new Promise((resolve, reject) => {
        let counter = 0;
        const quality = parseInt(process.env.QUALITY);
        const tSize = parseInt(process.env.THUMB_SIZE);
        const tQuality = parseInt(process.env.THUMB_QUALITY);

        function uploadStream(s3, metadata, format, thumb, resolve, reject) {
            const pass = new stream.PassThrough();
            const key = thumb ? `thumbs/${metadata.id}.${format}` : `${format}/${metadata.id}.${format}`;
            const params = { Bucket: process.env.BUCKET, Key: key, Body: pass };
            s3.upload(params, function(err, data) {
                if (err) {
                    reject(err);
                } else {
                    if (counter === 2) {
                        console.log(`Uploaded ${format} of ${metadata.filename} at: ${key}`);
                        resolve(metadata)
                    } else {
                        counter++;
                        console.log(`Uploaded ${format} of ${metadata.filename} at: ${key}`);
                    }
                }
            });

            return pass;
        }

        const readStream = fs.createReadStream(metadata.path);
        const pipeline = sharp();
        pipeline.clone().webp({ quality: quality }).pipe(uploadStream(s3, metadata, 'webp', false, resolve, reject))
        pipeline.clone().jpeg({ quality: quality }).pipe(uploadStream(s3, metadata, 'jpg', false, resolve, reject))
        pipeline.clone().resize(tSize, tSize, { fit: 'inside' }).jpeg({ quality: tQuality }).pipe(uploadStream(s3, metadata, 'jpg', true, resolve, reject))
        readStream.pipe(pipeline);
    })
}

function deleteFile(metadata) {
    return new Promise((resolve, reject) => {
        fs.unlink(metadata.path, err => {
            if (err) reject(err)
            else {
                console.log(`${metadata.filename} deleted.`);
                resolve(metadata);
            }
        })
    })
}

module.exports = {
    getAverage,
    saveRecord,
    resizeAndUpload,
    deleteFile
}