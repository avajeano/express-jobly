const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
    test("works", function() {
        const dataToUpdate = { firstName: 'Aliya', age: 32};
        const jsToSql = { firstName: 'first_name', age:'age'};
        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(result).toEqual({
            setCols: '"first_name"=$1, "age"=$2',
            values: ['Aliya', 32],
        }); 
    });

    test("bad request if no data", function () {
        expect( function () {
            sqlForPartialUpdate({}, {});
        }).toThrow(BadRequestError);
    });
})