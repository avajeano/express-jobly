"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/******************************************* create */

describe("create", function () {
    const newJob = {
        title: "testTitle",
        salary: 70000,
        equity: "0",
        companyHandle: "c1",
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual(newJob);

        const result = await db.query(
            `SELECT title, salary, equity, company_handle
            FROM jobs
            WHERE title = 'testTitle'`);
        expect(result.rows).toEqual([
            {
                title: "testTitle",
                salary: 70000,
                equity: "0",
                company_handle: "c1",
            },
        ]);
    });

    test("bad request with dupe", async function () {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();
        }   catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/******************************************* findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                title: "j1",
                salary: 100,
                equity: "0.1",
                companyHandle: "c1",
            },
            {
                title: "j2",
                salary: 200,
                equity: "0.2",
                companyHandle: "c2",
            },
            {
                title: "j3",
                salary: 300,
                equity: "0.3",
                companyHandle: "c3",
            },
        ]);
    });
});

/******************************************* get */

describe("get", function () {
    test("works", async function () {
        let job = await Job.get("j1");
        expect(job).toEqual({
            title: "j1",
            salary: 100,
            equity: "0.1",
            companyHandle: "c1"
        });
    });

    test("not found if not such job", async function () {
        try {
            await Job.get("invalid");
            fail();
        }   catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/******************************************* update */

describe("update", function () {
    const updateData = {
        salary: 1000,
        equity: "0.1"
    };

    test("works", async function () {
        let job = await Job.update("j1", updateData);
        expect(job).toEqual({
            title: "j1",
            salary: 1000,
            equity: "0.1",
            companyHandle: "c1"
        });

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE title = 'j1'`);
        expect(result.rows).toEqual([{
            title: "j1",
            salary: 1000,
            equity: "0.1",
            companyHandle: "c1",
        }]);
    });

    test("not found if no such title", async function () {
        try {
            await Job.update("invalid", updateData);
            fail();
        }   catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update("j1", {});
            fail();
        }   catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/******************************************* remove */

describe("remove", function () {
    test("works", async function () {
        await Job.remove("j1");
        const res = await db.query(
            `SELECT title FROM jobs WHERE title = 'j1'`);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such title", async function () {
        try {
            await Job.remove("invalid");
            fail();
        }   catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});