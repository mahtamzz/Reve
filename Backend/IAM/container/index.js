const createContainer = require("./createContainer");

let container = null;

async function initContainer() {
    if (!container) {
        container = await createContainer();
    }
    return container;
}

module.exports = initContainer;