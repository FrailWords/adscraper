import dotenv from "dotenv";
import {env} from "process";
import fs from "fs";

// @ts-ignore
import {ClarifaiStub, grpc} from "clarifai-nodejs-grpc";

dotenv.config();

const profileStr = env['PROFILE'];
const screenshotDirectory = env['SCREENSHOTS_DIR'] ? `${env['SCREENSHOTS_DIR']}/${profileStr}` : `user-data/${profileStr}`;
const API_KEY = env['CLARIFAI_API_KEY'];
const MODEL_ID = 'general-image-recognition';

const stub = ClarifaiStub.grpc();

// This will be used by every Clarifai endpoint call
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key " + API_KEY);

let imageFileNamesArray = []
let inputsArray = [];
fs.readdirSync(screenshotDirectory).forEach(function(image_filepath) {
    imageFileNamesArray.push(image_filepath);
    const imageBytes = fs.readFileSync(screenshotDirectory + "/" + image_filepath);
    inputsArray.push(
        { data: { image: { base64: imageBytes } } }
    );
});

stub.PostModelOutputs(
    {
        model_id: MODEL_ID,
        inputs: inputsArray
    },
    metadata,
    (err, response) => {
        if (err) {
            throw new Error(err);
        }

        if (response.status.code !== 10000) {
            throw new Error("Post model outputs failed, status: " + response.status.description);
        }

        const outputsArray = response.outputs;
        let overallAllConceptsArray = [];
        let overallUniqueConceptsSet = new Set();
        for (let idx = 0; idx < imageFileNamesArray.length; idx++) {
            const imageFileName = imageFileNamesArray[idx];
            const output = outputsArray[idx];
            let conceptNamesArray = [];
            for (const concept of output.data.concepts) {
                conceptNamesArray.push(concept.name);
                overallAllConceptsArray.push(concept.name);
                overallUniqueConceptsSet.add(concept.name);
            }
            // TODO: save to CSV
            // console.log("Concepts for " + imageFileName + ": " + conceptNamesArray.toString());
        }
        // TODO: save
        console.log(Array.from(overallUniqueConceptsSet.values()).toString());

        // generate frequency of overall concepts
        const count = {};
        // TODO: save
        overallAllConceptsArray.forEach(e => count[e] ? count[e]++ : count[e] = 1 );
    }
);