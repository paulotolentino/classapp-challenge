// Libs necessárias
const fs = require('fs');
const csv = require('csv-parser');

// Variáveis de inicialização
let jsonOutput = '[';
let addressCount = 0;
let addressesOnCsv = 0;

// Função para definir o numero máximo de endereços no csv
String.prototype.countEmailOrPhone = function () {
    return (this.match(/email/g) || this.match(/phone/g) || []).length
};

// Função que lê o csv e gera o arquivo de saída
fs.createReadStream('input.csv').pipe(csv()).on('data', (row) => {
    const rowKeys = Object.keys(row);
    const rowValues = Object.values(row);

    // Aqui eu conto quantas colunas de endereços existem no csv
    addressCount = 0;
    let aux = rowKeys.map(element => element.countEmailOrPhone())
    addressesOnCsv += aux.reduce((a, c) => a + c);


    // Aqui eu chamos a função returnElement para cada elemento do array rowKeys,
    // que retorna o objeto montado
    jsonOutput += '{';
    jsonOutput += rowKeys.map((element, index) => returnElement(element, index, rowValues))
    jsonOutput += '},';

    // Reset addressesOnCsv;
    addressesOnCsv = 0;
}).on('end', () => {
    // Finalizando a leitura do csv

    // Removendo a última virgula da string
    jsonOutput = jsonOutput.slice(0, -1);
    jsonOutput += ']';

    // Transformando a string em obj
    let file = JSON.parse(jsonOutput);

    // Eliminando todos os endereços com valores vazios
    const final = file.map(element => {
        return {
            ...element,
            addresses: element.addresses.filter(e => e.address !== '')
        }
    });

    // Retornando para string
    file = JSON.stringify(final);

    // Salvando o json
    fs.writeFileSync('output.json', file)
    console.log('CSV file successfully processed.\nPlease, look at the output.json file on the project directory.');
});


// Função que retorna os elementos 
const returnElement = (element, index, rowValues) => {

    if (element.includes('class')) {
        return isClass(index, rowValues);
    }
    else if (element.includes('phone') || element.includes('email')) {
        addressCount++;
        let retorno = addressCount === 1 ?
            `"addresses" : [${isAddress(element, index, rowValues)}`
            :
            `${isAddress(element, index, rowValues)}`;
        retorno += addressCount === addressesOnCsv ? ']' : '';
        return retorno;
    }
    return `"${element}" : "${rowValues[index]}"`;
}

// Função que retorna a string contendo a tag e array de classes
const isClass = (index, rowValues) => {
    const arrValues = rowValues[index].split(',');
    if (arrValues.length <= 1) {
        return `"classes" : "${rowValues[index]}"`;
    }
    const stringValues = arrValues.map(e => `"${e}"`)
    return `"classes" : [${stringValues}]`;
}

// Função que retorna a string contendo o objeto de addresses
const isAddress = (element, index, rowValues) => {
    const arrValues = element.substr(element.indexOf(' ') + 1).split(',');
    const stringValues = arrValues.map(e => `"${e}"`)

    return `{"type" : "${element.substr(0, element.indexOf(' '))}", "tags" : [${stringValues}], "address" : "${rowValues[index]}"}`;
}