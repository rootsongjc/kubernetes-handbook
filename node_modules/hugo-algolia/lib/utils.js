function copySettings(fromIndex, toIndex) {
    const settings = fromIndex.getSettings();

    if(settings['replicas'] !== undefined) {
        settings['replicas'] = undefined;
    }

    toIndex.setSettings(settings);
}

async function copySynonyms(fromIndex, toIndex) {
    let page = 0;

    do {
        let results =  await fromIndex.searchSynonyms({
            query: '',
            type: 'synonym,oneWaySynonym',
            page,
        });

        let synonyms = [];

        for(syn of results['hits']) {
            syn['_highlightResult'] = undefined;
            synonyms.push(syn);
        }

        if(synonyms.length === 0) {
            break;
        }

        toIndex.batchSynonyms(synonyms);

        page++;

    } while (true)
        
}

function convertToMap(list) {
    const listMap = new Map();
    Object.keys(list).forEach(key => {
        listMap.set(key, list[key]);
    });

    return Array.from(listMap);
}

module.exports.convertToMap = convertToMap;
module.exports.copySynonyms = copySynonyms;
module.exports.copySettings = copySettings;