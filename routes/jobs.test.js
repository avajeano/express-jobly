"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "newJob",
        salary: 400,
        equity: "0.4",
        companyHandle: "c1"
    };

    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({ 
            job: newJob,
        });
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "testTitle",
                salary: 0
            })
            .set("authorization",  `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "title",
                salary: "invalid",
                equity: "0",
                companyHandle: "c2" 
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400)
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        title: "j1",
                        salary: 100,
                        equity: "0.1",
                        companyHandle: "c1"
                    },
                    {
                        title: "j2",
                        salary: 200,
                        equity: "0.2",
                        companyHandle: "c2"
                    },
                    {
                        title: "j3",
                        salary: 300,
                        equity: "0.3",
                        companyHandle: "c3"
                    },
                ],
        });
    });

    test("works for title filter", async function () {
        const resp = await request(app).get("/jobs").query({ title: "j1" });
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        title: "j1",
                        salary: 100,
                        equity: "0.1",
                        companyHandle: "c1"
                    },
                ],
        });
    });

    test("works for minSalary filter", async function () {
        const resp = await request(app).get("/jobs").query({ minSalary: 200 });
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: "j2",
                    salary: 200,
                    equity: "0.2",
                    companyHandle: "c2"
                },
                {
                    title: "j3",
                    salary: 300,
                    equity: "0.3",
                    companyHandle: "c3"
                },
            ],
        });
    });

    test("works for hasEquity", async function () {
        const resp = await request(app).get("/jobs").query({ hasEquity: true });
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: "j1",
                    salary: 100,
                    equity: "0.1",
                    companyHandle: "c1"
                },
                {
                    title: "j2",
                    salary: 200,
                    equity: "0.2",
                    companyHandle: "c2"
                },
                {
                    title: "j3",
                    salary: 300,
                    equity: "0.3",
                    companyHandle: "c3"
                },
            ],
        });
    });
})

/************************************** GET /jobs/:title */

describe("GET /jobs/:title", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs?title=j1`);
        expect(resp.body).toEqual({
            jobs: [
                {
                    title: "j1",
                    salary: 100,
                    equity: "0.1",
                    companyHandle: "c1"
                },
            ],
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs?title=invalid`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:title */

describe("PATCH /jobs/:title", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/j1`)
            .send({
                title: "j1",
                salary: 10000,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                title: "j1",
                salary: 10000,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/j1`)
            .send({
                title: "j1",
                salary: 10000,
            })
        expect(resp.body).toEqual({"error": {"message": "Unauthorized", "status": 401}});
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/invalid`)
            .send({
                title: "invalid",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/j1`)
            .send({
                salary: "invalid",
            })
        expect(resp.statusCode).toEqual(401);
    });
});

/************************************** DELETE /jobs/:title */

describe("DELETE /jobs/:title", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/j1`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: "j1" });
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/j1`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/invalid`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});