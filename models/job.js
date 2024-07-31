"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job {from data} update db, return new data.
     * 
     * data should be { title, salary, equity, companyHandle }
     * 
     * Returns { title, salary, equity, companyHandle }
     * 
     * Throws BadRequestError if job already in databasae. 
     */

    static async create({ title, salary, equity, companyHandle }) {
        const duplicateCheck = await db.query(
            `SELECT title
            FROM jobs 
            WHERE title = $1`,
            [title]);

        if (duplicateCheck.rows[0])
            throw new BadRequestError(`Duplicate job: ${title}`);

        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                companyHandle,
            ],
        );
        const job = result.rows[0];
        
        return job;
    }

    /** Find all jobs.
     * 
     * Returns [{ title, salary, equity, companyHandle }]
     */

    static async findAll() {
        const jobsRes = await db.query(
            `SELECT title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs
            ORDER BY title`);
        return jobsRes.rows;
    }

    /** Given a title, return data about job.
     * 
     * Returns { title, salary, equity, companyHandle }
     *  where company is [{ handle, name, description, numEmployees, logoUrl }, ...]
     * 
     * Throws NotFoundError if not found.
     */

    static async get(title) {
        const jobRes = await db.query(
            `SELECT title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs
            WHERE title = $1`,
            [title])
        
        const job = jobRes.rows[0];

        if(!job) throw new NotFoundError(`No job: ${title}`);

        return job;
    }

    /** Given a query string, returns only jobs that include data from the query string parameters.
     * 
     * Returns { title, salary, equity, companyHandle }
     *  where title is '%query string%'
     *  where salary is min(num)
     *  where equity > 0 is true
     * 
     * Throws 400 error if minSalary > maxSalary
     * 
     * Throws NotFoundError if not found.
    */

    static async filter(title, minSalary, hasEquity) {
        let query = `SELECT title, salary, equity, company_handle AS "companyHandle" FROM jobs`;
        let searchParams = [];
        let sqlQuery = [];

        if (title !== undefined) {
            searchParams.push(`%${title}%`);
            sqlQuery.push(`title ILIKE $${searchParams.length}`)
        }

        if (minSalary !== undefined) {
            searchParams.push(minSalary);
            sqlQuery.push(`salary >= $${searchParams.length}`)
        }

        if (hasEquity === true) {
            searchParams.push(hasEquity);
            sqlQuery.push(`equity > 0`)
        }

        // combine search params into one query
        if (sqlQuery.length > 0) {
            query += " WHERE " + sqlQuery.join(" AND ");
        }
        
        const jobResults = await db.query(query, searchParams);
        const jobs = jobResults.rows;

        if (jobs.length == 0) {
            throw new NotFoundError("No jobs found.");
        }

        return jobs;
    }

    /** Update job data with `data `.
     * 
     * This is a "partial update" -- it's fine if the data doesn't contain all the fields;
     *  this only changes provided ones.
     * 
     * Data can include: {title, salary, equity}
     * 
     * Returns { title, salary, equity, companyHandle}
     * 
     * Throws NotFoundError if not found.
     */

    static async update(title, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                salary: "salary",
                equity: "equity"
            });
        const titleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                            SET ${setCols}
                            WHERE title = ${titleVarIdx}
                            RETURNING title, 
                                        salary,
                                        equity,
                                        company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, title]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${title}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     * 
     * Throws NotFoundError if job not found.
     */

    static async remove(title) {
        const result = await db.query(
            `DELETE 
            FROM jobs 
            WHERE title = $1
            RETURNING title`,
            [title]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${title}`);
    }
}

module.exports = Job;