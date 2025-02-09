const md5 = require('md5');

const generateEtag = (data) => {
    return md5(JSON.stringify(data));  
};

module.exports = generateEtag;