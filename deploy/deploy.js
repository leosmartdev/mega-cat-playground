const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.BKCN_AWS_ACCESS_KEY,
    secretAccessKey: process.env.BKCN_AWS_SECRET_ACCESS_KEY
});

(async function run() {
    const artifact = await createArtifact();

    uploadToS3(artifact);
})();

function createArtifact() {
    const promise = new Promise((res, rej) => {
        _createArtifact(res, rej);
    });

    return promise;
}

function uploadToS3(artifact) {
    const artifactLocation = artifact.path;
    console.log(`Uploading to S3, ${artifactLocation}`);

    var bucket = 'bookcoin-playground-artifacts';
    var key = 'bkcn-artifact';
                
    fs.readFile(artifactLocation, function (err, data) {
        if (err) { throw err; }

        const params = {
            Bucket: bucket,
            Key: key,
            Body: data,
            ContentType: 'zip'
        }

        s3.upload(params, function(err, data) {

            if (err) {
                console.log(err)
            } else {
                console.log(`Successfully uploaded data to ${bucket}/${key}`);
            }
        });
    });
}

function _createArtifact(resolve, reject) {
    const destinationFolder = path.join(__dirname, 'build', 'target.zip');
    
    const destinationArchive = fs.createWriteStream(destinationFolder);
    const archive = archiver('zip');

    destinationArchive.on('close', () => {
        console.log(archive.pointer() + ' total bytes have been finalized into output file.');
        resolve(destinationArchive);
    });

    archive.on('error',  (err) => {
        reject(err);
    });

    archive.pipe(destinationArchive);

    // TODO: adds what we need one at a time.
    const sourceDir = path.join(__dirname, '..', 'dist');
    // Put files at root of archive (.zip)
    archive.directory(sourceDir, false);

    archive.finalize();
}