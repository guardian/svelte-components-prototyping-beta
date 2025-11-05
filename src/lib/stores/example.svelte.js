import { getJson } from '$lib/helpers/util.js'

const url = "https://interactive.guim.co.uk/docsdata-test/1LdSTTEBoy4NcsSiaf7FuswOrPT0bbdztC0agMBU0eNk.json"

let exampledata = $state({})

const getExampleData = async () => {
    let data = await getJson(`${url}`)
    exampledata.animals = data.sheets.animals;
}

export {
    exampledata,
    getExampleData
}

