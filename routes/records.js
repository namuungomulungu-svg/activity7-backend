const router = require("express").Router();
const pool = require("../db");

// Allowed status values
const allowedStatuses = [
    "Pending",
    "In progress",
    "Completed"
];

// Validate record information
function validateRecord(body) {
    const { title, category, description, status } = body || {};

    if (
        typeof title !== "string" ||
        typeof category !== "string" ||
        typeof description !== "string" ||
        typeof status !== "string"
    ) {
        return "All four fields must be provided as text.";
    }

    const cleanTitle = title.trim();
    const cleanCategory = category.trim();
    const cleanDescription = description.trim();
    const cleanStatus = status.trim();

    if (cleanTitle.length < 3 || cleanTitle.length > 80) {
        return "Title must have 3 to 80 characters.";
    }

    if (cleanCategory.length < 2 || cleanCategory.length > 40) {
        return "Category must have 2 to 40 characters.";
    }

    if (cleanDescription.length < 5 || cleanDescription.length > 300) {
        return "Description must have 5 to 300 characters.";
    }

    if (!allowedStatuses.includes(cleanStatus)) {
        return "Status must be Pending, In progress or Completed.";
    }

    return null;
}

// Clean record information
function cleanRecord(body) {
    return {
        title: body.title.trim(),
        category: body.category.trim(),
        description: body.description.trim(),
        status: body.status.trim()
    };
}

// Validate record ID
function validateId(id) {
    return /^[1-9]\d*$/.test(id) &&
        Number.isSafeInteger(Number(id));
}

// GET ALL RECORDS
router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT id, title, category, description, status FROM records ORDER BY id"
        );

        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});

// GET ONE RECORD
router.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!validateId(id)) {
            return res.status(400).json({
                message: "ID must be a positive whole number."
            });
        }

        const result = await pool.query(
            "SELECT id, title, category, description, status FROM records WHERE id = $1",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Record not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// POST - CREATE RECORD
router.post("/", async (req, res, next) => {
    try {
        const errorMessage = validateRecord(req.body);

        if (errorMessage) {
            return res.status(400).json({
                message: errorMessage
            });
        }

        const record = cleanRecord(req.body);

        const result = await pool.query(
            `INSERT INTO records
            (title, category, description, status)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, category, description, status`,
            [
                record.title,
                record.category,
                record.description,
                record.status
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// PUT - UPDATE RECORD
router.put("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!validateId(id)) {
            return res.status(400).json({
                message: "ID must be a positive whole number."
            });
        }

        const errorMessage = validateRecord(req.body);

        if (errorMessage) {
            return res.status(400).json({
                message: errorMessage
            });
        }

        const record = cleanRecord(req.body);

        const result = await pool.query(
            `UPDATE records
            SET title = $1,
                category = $2,
                description = $3,
                status = $4
            WHERE id = $5
            RETURNING id, title, category, description, status`,
            [
                record.title,
                record.category,
                record.description,
                record.status,
                id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Record not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// DELETE RECORD
router.delete("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!validateId(id)) {
            return res.status(400).json({
                message: "ID must be a positive whole number."
            });
        }

        const result = await pool.query(
            "DELETE FROM records WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Record not found."
            });
        }

        res.status(200).json({
            message: "Record deleted."
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;